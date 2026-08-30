"use client";

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client do Supabase para uso no browser (Client Components).
 * Use apenas onde há interação — formulários, realtime, mutações otimistas.
 * Leitura de dados deve preferir o client de servidor.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
