"use client";

/**
 * Ponte de compatibilidade para os hooks herdados da versão Vite.
 *
 * O código novo deve importar de '@/lib/supabase/client' (browser) ou
 * '@/lib/supabase/server' (servidor). Este arquivo existe apenas para manter
 * os hooks antigos compilando durante a migração e sai quando eles forem
 * reescritos na fase 03.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
