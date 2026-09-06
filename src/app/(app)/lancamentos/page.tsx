import { createClient } from '@/lib/supabase/server';
import { PainelLancamentos } from '@/components/lancamentos/PainelLancamentos';
import type {
  Conta,
  Cartao,
  Area,
  Categoria,
  Origem,
  Lancamento,
} from '@/types/financeiro';

/**
 * Lançamentos — onde se consulta e se corrige.
 *
 * Os filtros vivem na URL para que uma busca sobreviva ao recarregamento
 * e possa ser guardada como link.
 */
export default async function PaginaLancamentos({
  searchParams,
}: {
  searchParams: Promise<{
    de?: string;
    ate?: string;
    tipo?: string;
    status?: string;
    area?: string;
    responsavel?: string;
    origem?: string;
    busca?: string;
  }>;
}) {
  const f = await searchParams;
  const supabase = await createClient();

  // Sem período informado, mostra o mês corrente — é o recorte que
  // responde "como está este mês", que é a pergunta mais frequente.
  const hoje = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const de = f.de || iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const ate = f.ate || iso(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));

  let consulta = supabase
    .from('lancamentos')
    .select('*')
    .gte('data', de)
    .lte('data', ate)
    .order('data', { ascending: false })
    .limit(300);

  if (f.tipo === 'entrada' || f.tipo === 'saida') {
    consulta = consulta.eq('tipo', f.tipo);
  }
  if (f.status && ['previsto', 'pendente', 'pago'].includes(f.status)) {
    consulta = consulta.eq('status', f.status);
  }
  if (f.area) consulta = consulta.eq('area_id', f.area);
  if (f.responsavel && ['john', 'amanda', 'casal'].includes(f.responsavel)) {
    consulta = consulta.eq('responsavel', f.responsavel);
  }
  if (f.origem === 'agente' || f.origem === 'manual') {
    consulta = consulta.eq('origem', f.origem);
  }
  if (f.busca) consulta = consulta.ilike('descricao', `%${f.busca}%`);

  const [lancRes, contasRes, cartoesRes, areasRes, categoriasRes, origensRes] =
    await Promise.all([
      consulta,
      supabase.from('accounts').select('*').order('name'),
      supabase.from('cards').select('*').order('name'),
      supabase.from('areas').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('origens').select('*').eq('ativa', true).order('nome'),
    ]);

  return (
    <PainelLancamentos
      lancamentos={(lancRes.data ?? []) as Lancamento[]}
      contas={(contasRes.data ?? []) as Conta[]}
      cartoes={(cartoesRes.data ?? []) as Cartao[]}
      areas={(areasRes.data ?? []) as Area[]}
      categorias={(categoriasRes.data ?? []) as Categoria[]}
      origens={(origensRes.data ?? []) as Origem[]}
      filtros={{ ...f, de, ate }}
      erro={lancRes.error?.message ?? null}
    />
  );
}
