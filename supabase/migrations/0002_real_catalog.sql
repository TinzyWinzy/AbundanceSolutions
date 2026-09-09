-- ============================================================
-- Abundance Solutions - Real catalog (client photos + flyer prices)
-- Self-sufficient: works whether or not 0001 seed was applied.
-- Idempotent: safe to re-run (upserts by id).
-- ============================================================

-- Ensure the org exists (same id as 0001 seed).
insert into organizations (id, name, slug, currency)
values ('00000000-0000-0000-0000-000000000001', 'Abundance Solutions', 'abundance', 'USD')
on conflict (slug) do nothing;

-- Remove generic placeholder seed items from 0001 (if present).
delete from inventory_assets
where id in (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000104'
);

-- Remove placeholder seed categories from 0001 (if present and unused).
delete from categories
where id in (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013'
);

-- Real categories.
insert into categories (id, organization_id, name, slug, sort_order) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Generators', 'generators', 1),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Excavators and Loaders', 'earthmoving', 2),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Concrete Mixers', 'concrete-mixers', 3),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Power Tools', 'power-tools', 4)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order;

-- Real catalog items (prices from client flyers; ZiG at 13x).
insert into inventory_assets
  (id, organization_id, category_id, name, description, sku, price_usd, price_zig,
   stock_count, min_stock, image_urls, thumbnail_url, status)
values
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', 'Diesel Generator 10KVA 3-Phase', 'Reliable 3-phase site power. INGCO Pro-Stores range.', null, 3000.00, 39000.00, 1, 1, ARRAY['/images/machinery/generators-flyer.jpg'], '/images/machinery/generators-flyer.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', 'Diesel Generator 15KVA 3-Phase', 'Reliable 3-phase site power. INGCO Pro-Stores range.', null, 6500.00, 84500.00, 1, 1, ARRAY['/images/machinery/generators-flyer.jpg'], '/images/machinery/generators-flyer.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', 'Diesel Generator 250KVA', 'Heavy-duty standby power for large sites.', null, 30000.00, 390000.00, 1, 1, ARRAY['/images/machinery/generators-flyer.jpg'], '/images/machinery/generators-flyer.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', 'Diesel Generator 300KVA', 'Heavy-duty standby power for large sites.', null, 35000.00, 455000.00, 1, 1, ARRAY['/images/machinery/generators-flyer.jpg'], '/images/machinery/generators-flyer.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', 'Petrol Generator (Open Frame)', 'Portable open-frame generator for tools and lighting.', null, null, null, 1, 1, ARRAY['/images/machinery/open-frame-generator.jpg'], '/images/machinery/open-frame-generator.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', 'Diesel Welder Generator GDW65001', '4.6kW starting / 4.2kW running, 180A welding current.', 'GDW65001', null, null, 1, 1, ARRAY['/images/machinery/welder-generator.jpg'], '/images/machinery/welder-generator.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', 'Dezzi HD820 Excavator', 'Brand new, 000hrs. Heavy earthmoving.', null, null, null, 1, 1, ARRAY['/images/machinery/dezzi-excavator.jpg'], '/images/machinery/dezzi-excavator.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', 'Backhoe Loader', 'Brand new, 000hrs. Digging and loading.', null, null, null, 1, 1, ARRAY['/images/machinery/backhoe-loader.jpg'], '/images/machinery/backhoe-loader.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', 'Wheel Loader XC968', 'Brand new, 000hrs. Loading and stockpiling.', null, null, null, 1, 1, ARRAY['/images/machinery/wheel-loader.jpg'], '/images/machinery/wheel-loader.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022', 'INGCO Concrete Mixer', 'Site concrete mixing.', null, null, null, 1, 1, ARRAY['/images/machinery/concrete-mixer.jpg'], '/images/machinery/concrete-mixer.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', 'INGCO Angle Grinder 1280W 115mm 42V', 'Li-ion brushless, battery and charger included.', null, 180.64, 2348.32, 1, 1, ARRAY['/images/machinery/angle-grinder-42v.jpg'], '/images/machinery/angle-grinder-42v.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000141', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', 'Angle Grinder Range', 'Grinders and cutting discs from $41.55.', null, 41.55, 540.15, 1, 1, ARRAY['/images/machinery/grinders-range.jpg'], '/images/machinery/grinders-range.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000142', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', 'INGCO Impact Drill 42V', 'Li-ion cordless brushless impact drill.', null, 114.95, 1494.35, 1, 1, ARRAY['/images/machinery/impact-drill.jpg'], '/images/machinery/impact-drill.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', 'INGCO Rotary Hammer 42V 26mm', 'Li-ion rotary hammer drill.', null, 180.64, 2348.32, 1, 1, ARRAY['/images/machinery/rotary-hammer.jpg'], '/images/machinery/rotary-hammer.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000144', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', 'INGCO Cordless Drill 16V', 'Compact brushless 16V with 2.0Ah batteries.', null, 84.73, 1101.49, 1, 1, ARRAY['/images/machinery/drill-16v.jpg'], '/images/machinery/drill-16v.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000145', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', 'INGCO Plasma Cutter', 'Inverter plasma cutter.', null, 282.27, 3669.51, 1, 1, ARRAY['/images/machinery/plasma-cutter.jpg'], '/images/machinery/plasma-cutter.jpg', 'available'),
  ('00000000-0000-0000-0000-000000000146', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', 'INGCO Gasoline Water Pump 2in', '2-inch petrol water pump.', null, 218.35, 2838.55, 1, 1, ARRAY['/images/machinery/water-pump.jpg'], '/images/machinery/water-pump.jpg', 'available')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sku = excluded.sku,
  price_usd = excluded.price_usd,
  price_zig = excluded.price_zig,
  image_urls = excluded.image_urls,
  thumbnail_url = excluded.thumbnail_url,
  status = excluded.status;
