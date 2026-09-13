import { createClient } from '@/lib/supabase/server';
import {
  PainelLimites,
  type LinhaDeLimite,
  type LimiteBruto,
} from '@/components/limites/PainelLimites';
import type { Area, Categoria, Lancamento } from '@/types/financeiro';

/**
 * Limites — teto de custo por área, não orçamento.
 *
 * O John foi explícito no planejamento: não usa orçamento, quer saber se
 * está abaixo do teto. Nada trava, nada bloqueia lançamento; a tela
 * informa.
 *
 * O gasto medido é o do dia — conta e cartão somados — e não o que saiu
 * da conta. Limite de categoria mede comportamento: como quase todo gasto
 * de mercado e restaurante é no crédito, medir pela saída de dinheiro
 * deixaria Alimentação zerada o mês inteiro e estouraria de uma vez no
 * dia da fatura.
 */
function fimDoMes(ano: number, mes: number): string {
  const d = new Date(ano, mes, 0);
  return `${ano}-${String(mes).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function PaginaLimites({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string }>;
}) {
  const { mes: mesParam, ano: anoParam } = await searchParams;

  const agora = new Date();
  const mes =
    Number(mesParam) >= 1 && Number(mesParam) <= 12
      ? Number(mesParam)
      : agora.getMonth() + 1;
  const ano =
    Number(anoParam) >= 2020 && Number(anoParam) <= 2100
      ? Number(anoParam)
      : agora.getFullYear();

  const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = fimDoMes(ano, mes);

  const supabase = await createClient();

  const [areasRes, categoriasRes, limitesRes, lancRes] = await Promise.all([
    supabase.from('areas').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('limites').select('*'),
    supabase
      .from('lancamentos')
      .select('valor, data, area_id, categoria_id')
      .eq('tipo', 'saida')
      .eq('transferencia_interna', false)
      .gte('data', primeiroDia)
      .lte('data', ultimoDia),
  ]);

  const areas = (areasRes.data ?? []) as Area[];
  const categorias = (categoriasRes.data ?? []) as Categoria[];
  const limites = (limitesRes.data ?? []) as LimiteBruto[];
  const doMes = (lancRes.data ?? []) as Pick<
    Lancamento,
    'valor' | 'data' | 'area_id' | 'categoria_id'
  >[];

  // ----------------------------------------------------------------
  // Gasto do mês, por área e por categoria
  // ----------------------------------------------------------------
  const gastoArea = new Map<string, number>();
  const gastoCategoria = new Map<string, number>();

  for (const l of doMes) {
    if (!l.area_id) continue;
    gastoArea.set(l.area_id, (gastoArea.get(l.area_id) ?? 0) + Number(l.valor));
    if (l.categoria_id) {
      gastoCategoria.set(
        l.categoria_id,
        (gastoCategoria.get(l.categoria_id) ?? 0) + Number(l.valor)
      );
    }
  }

  // ----------------------------------------------------------------
  // Qual limite vale agora
  // ----------------------------------------------------------------
  // Um teto de período em vigor manda sobre a exceção do mês, que manda
  // sobre o permanente — do mais específico para o mais geral.
  function limiteVigente(
    areaId: string,
    categoriaId: string | null
  ): LimiteBruto | null {
    const daChave = limites.filter(
      (l) => l.area_id === areaId && (l.categoria_id ?? null) === categoriaId
    );

    const periodo = daChave.find(
      (l) => l.inicio && l.fim && l.inicio <= ultimoDia && l.fim >= primeiroDia
    );
    if (periodo) return periodo;

    const mensal = daChave.find((l) => l.mes === mes && l.ano === ano);
    if (mensal) return mensal;

    return daChave.find((l) => !l.mes && !l.inicio) ?? null;
  }

  // O gasto acumulado de um teto de período precisa de outra consulta:
  // ele soma meses que não são o corrente.
  const acumuladoPorLimite = new Map<string, number>();

  const periodosVigentes = limites.filter(
    (l) => l.inicio && l.fim && l.inicio <= ultimoDia && l.fim >= primeiroDia
  );

  for (const p of periodosVigentes) {
    let consulta = supabase
      .from('lancamentos')
      .select('valor')
      .eq('tipo', 'saida')
      .eq('transferencia_interna', false)
      .eq('area_id', p.area_id)
      .gte('data', p.inicio!)
      .lte('data', p.fim!);

    if (p.categoria_id) consulta = consulta.eq('categoria_id', p.categoria_id);

    const { data } = await consulta;
    acumuladoPorLimite.set(
      p.id,
      (data ?? []).reduce((s, l) => s + Number(l.valor), 0)
    );
  }

  // ----------------------------------------------------------------
  // Uma linha por área com limite ou com gasto
  // ----------------------------------------------------------------
  const linhas: LinhaDeLimite[] = areas
    .filter((a) => limiteVigente(a.id, null) || (gastoArea.get(a.id) ?? 0) > 0)
    .map((a) => {
      const limite = limiteVigente(a.id, null);

      return {
        areaId: a.id,
        nome: a.name,
        gasto: gastoArea.get(a.id) ?? 0,
        limite,
        acumulado: limite?.inicio ? (acumuladoPorLimite.get(limite.id) ?? 0) : null,
        categorias: categorias
          .filter((c) => c.area_id === a.id)
          .map((c) => ({
            categoriaId: c.id,
            nome: c.name,
            gasto: gastoCategoria.get(c.id) ?? 0,
            limite: limiteVigente(a.id, c.id),
          }))
          .filter((c) => c.gasto > 0 || c.limite)
          .sort((x, y) => y.gasto - x.gasto),
      };
    });

  const totalLimite = linhas.reduce(
    (s, l) => s + (l.limite && !l.limite.inicio ? Number(l.limite.valor) : 0),
    0
  );
  const totalGasto = linhas.reduce((s, l) => s + l.gasto, 0);

  const diasNoMes = new Date(ano, mes, 0).getDate();
  const diaCorrente =
    ano === agora.getFullYear() && mes === agora.getMonth() + 1
      ? agora.getDate()
      : null;

  return (
    <PainelLimites
      linhas={linhas}
      areas={areas}
      categorias={categorias}
      mes={mes}
      ano={ano}
      totalLimite={totalLimite}
      totalGasto={totalGasto}
      diasNoMes={diasNoMes}
      diaCorrente={diaCorrente}
      erro={limitesRes.error?.message ?? null}
    />
  );
}
