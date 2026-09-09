/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_POWERSYNC_URL: string;
  readonly VITE_WHATSAPP_NUMBER: string;
  readonly VITE_APP_DOMAIN: string;
  // Demo test-admin access. Dev-only: the whole demo path is compiled
  // out of production builds via import.meta.env.DEV. Values live in
  // gitignored .env.local, never in code.
  readonly VITE_DEMO_PIN?: string;
  readonly VITE_DEMO_EMAIL?: string;
  readonly VITE_DEMO_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
