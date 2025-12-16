/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    // Supabase
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly SUPABASE_SERVICE_ROLE_KEY?: string;
    
    // Gemini AI
    readonly GEMINI_API_KEY: string;
    
    // Stripe
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
    readonly STRIPE_SECRET_KEY?: string;
    
    // Server
    readonly PORT?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {}