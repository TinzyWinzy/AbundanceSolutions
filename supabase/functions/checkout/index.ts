// Supabase Edge Function: public checkout.
// Runs with service_role (bypasses RLS). All prices come from the DB -
// client-supplied prices are ignored. Callable with the anon key, so
// signed-out prospects can check out. Deploy with:
//   supabase functions deploy checkout

import { createClient } from 'jsr:@supabase/supabase-js@2';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_ORIGINS = [
  'https://abundance.co.zw',
  'https://www.abundance.co.zw',
  'https://abundancesolutions.vercel.app',
  'http://localhost:5173',
  'http://localhost:5199',
];

function allowedOrigins(): Set<string> {
  // Extend without redeploying: set ALLOWED_ORIGINS to a comma-separated
  // list in the function environment (e.g. Vercel preview URLs).
  const extra = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...extra]);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && allowedOrigins().has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function randomSuffix(length = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function orderRef(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `ORD-${y}${m}${d}-${randomSuffix()}`;
}

/** Normalize ZW numbers to 263XXXXXXXXX, or null if invalid. */
function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let p = raw.replace(/[\s\-()]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = '263' + p.slice(1);
  return /^263\d{9}$/.test(p) ? p : null;
}

interface CheckoutLine {
  assetId: unknown;
  quantity: unknown;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  let body: {
    customerName?: unknown;
    customerPhone?: unknown;
    lines?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers,
    });
  }

  const customerName =
    typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 120) : '';
  const customerPhone = normalizePhone(body.customerPhone);
  const lines = Array.isArray(body.lines) ? (body.lines as CheckoutLine[]) : [];

  if (!customerName) {
    return new Response(JSON.stringify({ error: 'Customer name is required' }), {
      status: 400,
      headers,
    });
  }
  if (!customerPhone) {
    return new Response(JSON.stringify({ error: 'Valid ZW phone number is required' }), {
      status: 400,
      headers,
    });
  }
  if (lines.length === 0 || lines.length > 50) {
    return new Response(JSON.stringify({ error: 'Between 1 and 50 line items required' }), {
      status: 400,
      headers,
    });
  }

  const cleanLines: { assetId: string; quantity: number }[] = [];
  for (const l of lines) {
    if (
      typeof l.assetId !== 'string' ||
      !UUID_RE.test(l.assetId) ||
      typeof l.quantity !== 'number' ||
      !Number.isInteger(l.quantity) ||
      l.quantity < 1 ||
      l.quantity > 999
    ) {
      return new Response(JSON.stringify({ error: 'Invalid line item' }), {
        status: 400,
        headers,
      });
    }
    cleanLines.push({ assetId: l.assetId, quantity: l.quantity });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase environment in function');
    return new Response(JSON.stringify({ error: 'Checkout unavailable' }), {
      status: 500,
      headers,
    });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // Prices always come from the DB.
  const assetIds = [...new Set(cleanLines.map((l) => l.assetId))];
  const { data: assets, error: assetsError } = await supabase
    .from('inventory_assets')
    .select('id, organization_id, name, price_usd, price_zig, status')
    .in('id', assetIds);

  if (assetsError || !assets || assets.length !== assetIds.length) {
    return new Response(JSON.stringify({ error: 'One or more items are unavailable' }), {
      status: 400,
      headers,
    });
  }
  const unavailable = assets.find((a) => a.status !== 'available');
  if (unavailable) {
    return new Response(
      JSON.stringify({ error: `${unavailable.name ?? 'Item'} is no longer available` }),
      { status: 400, headers },
    );
  }
  const orgIds = new Set(assets.map((a) => a.organization_id as string));
  if (orgIds.size !== 1) {
    return new Response(JSON.stringify({ error: 'Items span multiple stores' }), {
      status: 400,
      headers,
    });
  }
  const organizationId = [...orgIds][0];

  const priceById = new Map(
    assets.map((a) => [a.id as string, { usd: a.price_usd as number | null, zig: a.price_zig as number | null }]),
  );
  const round2 = (n: number) => Math.round(n * 100) / 100;
  let totalUsd = 0;
  const items = cleanLines.map((l) => {
    const p = priceById.get(l.assetId) ?? { usd: 0, zig: null };
    const unitUsd = p.usd ?? 0;
    totalUsd += unitUsd * l.quantity;
    return { asset_id: l.assetId, quantity: l.quantity, unit_price_usd: unitUsd, unit_price_zig: p.zig };
  });
  totalUsd = round2(totalUsd);

  // Latest org rate for the ZiG equivalent (null when unset - never invented).
  const { data: rateRow } = await supabase
    .from('exchange_rates')
    .select('official_rate')
    .eq('organization_id', organizationId)
    .order('effective_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const appliedRate = rateRow ? Number(rateRow.official_rate) : null;
  const totalZig = appliedRate ? round2(totalUsd * appliedRate) : null;

  const reference = orderRef();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: organizationId,
      customer_name: customerName,
      customer_phone: customerPhone,
      status: 'pending',
      total_usd: totalUsd,
      total_zig: totalZig,
      reference,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Order insert failed', orderError);
    return new Response(JSON.stringify({ error: 'Could not place order' }), {
      status: 500,
      headers,
    });
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    items.map((item) => ({ ...item, order_id: order.id as string })),
  );
  if (itemsError) {
    console.error('Order items insert failed', itemsError);
    await supabase.from('orders').delete().eq('id', order.id);
    return new Response(JSON.stringify({ error: 'Could not place order' }), {
      status: 500,
      headers,
    });
  }

  return new Response(
    JSON.stringify({
      orderId: order.id,
      reference,
      totalUsd,
      totalZig,
      appliedRate,
    }),
    { status: 200, headers },
  );
});
