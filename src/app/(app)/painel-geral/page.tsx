import { createClient } from '@/lib/supabase/server';
import { PainelGeral, type LinhaDaGrade } from '@/components/geral/PainelGeral';
import type { Area, Lancamento } from '@/types/financeiro';

/**
 * Painel Geral — o Plano de Contas do Breno, aberto no ano.
 *
 * Enquanto o Painel Diário responde "como estou hoje", esta grade responde
 * "como vai ser o ano": cada área é uma linha, cada mês uma coluna. Serve
 * para enxergar sazonalidade — o mês em que o gás sobe, o mês do IPVA —
 * e para ver dezembro ainda em setembro.
 *
 * Os dados já existem: as recorrências foram materializadas 24 meses à
 * frente, então as colunas futuras vêm preenchidas sem precisar projetar
 * nada aqui.
 */
export default async function PaginaPainelGeral({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano: anoParam } = await searchParams;

  const agora = new Date();
  const ano =
    Number(anoParam) >= 2020 && Number(anoParam) <= 2100
      ? Number(anoParam)
      : agora.getFullYear();

  const supabase = await createClient();

  const [areasRes, lancRes] = await Promise.all([
    supabase.from('areas').select('*').order('name'),
    // Transferência entre as contas do casal fica de fora: move dinheiro
    // de um bolso para o outro e inflaria receita e despesa ao mesmo tempo.
    supabase
      .from('lancamentos')
      .select('tipo, valor, data, area_id')
      .eq('transferencia_interna', false)
      .gte('data', `${ano}-01-01`)
      .lte('data', `${ano}-12-31`),
  ]);

  const areas = (areasRes.data ?? []) as Area[];
  const lancamentos = (lancRes.data ?? []) as Pick<
    Lancamento,
    'tipo' | 'valor' | 'data' | 'area_id'
  >[];

  const zerado = () => Array<number>(12).fill(0);

  const receitas = zerado();
  const porArea = new Map<string, number[]>();
  const semArea = zerado();

  for (const l of lancamentos) {
    const mes = Number(l.data.slice(5, 7)) - 1;
    const valor = Number(l.valor);

    if (l.tipo === 'entrada') {
      receitas[mes] += valor;
      continue;
    }

    if (!l.area_id) {
      semArea[mes] += valor;
      continue;
    }

    const linha = porArea.get(l.area_id) ?? zerado();
    linha[mes] += valor;
    porArea.set(l.area_id, linha);
  }

  // Só as áreas que tiveram movimento no ano: uma grade com dez linhas
  // zeradas esconde as três que importam.
  const linhas: LinhaDaGrade[] = areas
    .filter((a) => porArea.has(a.id))
    .map((a) => ({
      id: a.id,
      nome: a.name,
      classificacao: a.classificacao,
      meses: porArea.get(a.id) ?? zerado(),
    }));

  if (semArea.some((v) => v > 0)) {
    linhas.push({
      id: 'sem-area',
      nome: 'Sem área',
      classificacao: null,
      meses: semArea,
    });
  }

  const despesas = zerado();
  for (const linha of linhas) {
    for (let m = 0; m < 12; m++) despesas[m] += linha.meses[m];
  }

  const saldo = receitas.map((r, m) => r - despesas[m]);

  return (
    <PainelGeral
      ano={ano}
      receitas={receitas}
      linhas={linhas}
      despesas={despesas}
      saldo={saldo}
      mesCorrente={ano === agora.getFullYear() ? agora.getMonth() : null}
      erro={lancRes.error?.message ?? null}
    />
  );
}
