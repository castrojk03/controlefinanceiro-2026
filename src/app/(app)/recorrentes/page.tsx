import { createClient } from '@/lib/supabase/server';
import { PainelRecorrentes } from '@/components/recorrentes/PainelRecorrentes';
import type {
  Conta,
  Cartao,
  Area,
  Categoria,
  Recorrencia,
} from '@/types/financeiro';

/**
 * Contas recorrentes — o Plano de Contas.
 * É daqui que sai o bloco "próximos 7 dias" e o aviso do agente.
 */
export default async function PaginaRecorrentes() {
  const supabase = await createClient();

  const [recorrRes, contasRes, cartoesRes, areasRes, categoriasRes] =
    await Promise.all([
      supabase
        .from('recorrencias')
        .select('*')
        .order('encerrada_em', { nullsFirst: true })
        .order('dia_do_mes', { nullsFirst: false }),
      supabase.from('accounts').select('*').order('name'),
      supabase.from('cards').select('*').order('name'),
      supabase.from('areas').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);

  return (
    <PainelRecorrentes
      recorrencias={(recorrRes.data ?? []) as Recorrencia[]}
      contas={(contasRes.data ?? []) as Conta[]}
      cartoes={(cartoesRes.data ?? []) as Cartao[]}
      areas={(areasRes.data ?? []) as Area[]}
      categorias={(categoriasRes.data ?? []) as Categoria[]}
      erro={recorrRes.error?.message ?? null}
    />
  );
}
