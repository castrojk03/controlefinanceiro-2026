import { createClient } from '@/lib/supabase/server';
import { PainelGeral, type LinhaDaGrade } from '@/components/geral/PainelGeral';
import type { Area, Categoria, Lancamento } from '@/types/financeiro';

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

  const [areasRes, categoriasRes, lancRes] = await Promise.all([
    supabase.from('areas').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
    // Transferência entre as contas do casal fica de fora: move dinheiro
    // de um bolso para o outro e inflaria receita e despesa ao mesmo tempo.
    supabase
      .from('lancamentos')
      .select('tipo, valor, data, area_id, categoria_id')
      .eq('transferencia_interna', false)
      .gte('data', `${ano}-01-01`)
      .lte('data', `${ano}-12-31`),
  ]);

  const areas = (areasRes.data ?? []) as Area[];
  const categorias = (categoriasRes.data ?? []) as Categoria[];
  const lancamentos = (lancRes.data ?? []) as Pick<
    Lancamento,
    'tipo' | 'valor' | 'data' | 'area_id' | 'categoria_id'
  >[];

  const zerado = () => Array<number>(12).fill(0);

  const receitas = zerado();
  const porArea = new Map<string, number[]>();
  const semArea = zerado();

  // A sazonalidade mora na categoria, não na área: "Habitação subiu em
  // março" não diz nada; "o gás subiu em março" diz. A chave junta área e
  // categoria porque nomes como "Outros" se repetem entre áreas.
  const porCategoria = new Map<string, number[]>();

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

    const chave = `${l.area_id}:${l.categoria_id ?? 'sem'}`;
    const sub = porCategoria.get(chave) ?? zerado();
    sub[mes] += valor;
    porCategoria.set(chave, sub);
  }

  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.name]));

  // Só as áreas que tiveram movimento no ano: uma grade com dez linhas
  // zeradas esconde as três que importam.
  const linhas: LinhaDaGrade[] = areas
    .filter((a) => porArea.has(a.id))
    .map((a) => ({
      id: a.id,
      nome: a.name,
      classificacao: a.classificacao,
      meses: porArea.get(a.id) ?? zerado(),
      categorias: [...porCategoria.entries()]
        .filter(([chave]) => chave.startsWith(`${a.id}:`))
        .map(([chave, meses]) => {
          const idCategoria = chave.slice(a.id.length + 1);
          return {
            id: chave,
            nome:
              idCategoria === 'sem'
                ? 'Sem categoria'
                : (nomeCategoria.get(idCategoria) ?? 'Sem categoria'),
            meses,
          };
        })
        // Maior gasto primeiro: é o que a pessoa procura ao abrir a área.
        .sort(
          (a, b) =>
            b.meses.reduce((s, v) => s + v, 0) -
            a.meses.reduce((s, v) => s + v, 0)
        ),
    }));

  if (semArea.some((v) => v > 0)) {
    linhas.push({
      id: 'sem-area',
      nome: 'Sem área',
      classificacao: null,
      meses: semArea,
      categorias: [],
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
