import { createClient } from '@/lib/supabase/server';
import { PainelConfiguracoes } from '@/components/configuracoes/PainelConfiguracoes';
import type { Conta, Cartao, Area } from '@/types/financeiro';

/**
 * Configurações. A leitura acontece no servidor — a RLS já filtra pelo
 * usuário da sessão, então não é preciso comparar user_id na consulta.
 */
export default async function PaginaConfiguracoes() {
  const supabase = await createClient();

  const [contasRes, cartoesRes, areasRes] = await Promise.all([
    supabase.from('accounts').select('*').order('name'),
    supabase.from('cards').select('*').order('name'),
    supabase.from('areas').select('*').order('name'),
  ]);

  const contas = (contasRes.data ?? []) as Conta[];
  const cartoes = (cartoesRes.data ?? []) as Cartao[];
  const areas = (areasRes.data ?? []) as Area[];

  const erro =
    contasRes.error?.message ??
    cartoesRes.error?.message ??
    areasRes.error?.message ??
    null;

  return (
    <PainelConfiguracoes
      contas={contas}
      cartoes={cartoes}
      areas={areas}
      erro={erro}
    />
  );
}
