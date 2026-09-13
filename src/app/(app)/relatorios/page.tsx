import { createClient } from '@/lib/supabase/server';
import {
  PainelRelatorios,
  type Balde,
  type MesDoAno,
} from '@/components/relatorios/PainelRelatorios';
import type { Area, Lancamento } from '@/types/financeiro';

/**
 * Relatórios — o 50-35-15 e a taxa de economia.
 *
 * É a terceira camada do método, e a única de fechamento: o Plano de
 * Contas olha o vencimento, o Termômetro olha o dia, e aqui se olha a
 * proporção. Por isso vive nesta tela e não na inicial — é análise de
 * fechamento, não do dia.
 *
 * A proporção é calculada sobre a RECEITA, não sobre o total gasto. As
 * metas 50-35-15 somam 100%, o que só faz sentido com a receita no
 * denominador; e assim o que falta para 100% é a economia do mês, que é
 * exatamente a métrica do card ao lado. Sobre o total gasto, um mês de
 * aperto e um mês folgado mostrariam a mesma proporção.
 */
const METAS: Record<string, number> = {
  fixo: 50,
  prioridade: 35,
  estilo_vida: 15,
};

const ROTULOS: Record<string, string> = {
  fixo: 'Gastos fixos',
  prioridade: 'Prioridade financeira',
  estilo_vida: 'Estilo de vida',
};

export default async function PaginaRelatorios({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const { ano: anoParam, mes: mesParam } = await searchParams;

  const agora = new Date();
  const ano =
    Number(anoParam) >= 2020 && Number(anoParam) <= 2100
      ? Number(anoParam)
      : agora.getFullYear();
  const mes =
    Number(mesParam) >= 1 && Number(mesParam) <= 12
      ? Number(mesParam)
      : agora.getMonth() + 1;

  const supabase = await createClient();

  const [areasRes, lancRes] = await Promise.all([
    supabase.from('areas').select('*'),
    // O ano inteiro numa consulta: a taxa de economia precisa de todos os
    // meses, e a proporção precisa de um. Duas consultas seriam duas
    // viagens ao banco pelo mesmo dado.
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

  const classificacaoDaArea = new Map(
    areas.map((a) => [a.id, a.classificacao])
  );

  // ----------------------------------------------------------------
  // O ano, para a taxa de economia
  // ----------------------------------------------------------------
  const receitaPorMes = Array<number>(12).fill(0);
  const despesaPorMes = Array<number>(12).fill(0);

  // ----------------------------------------------------------------
  // O mês escolhido, para a proporção
  // ----------------------------------------------------------------
  const porBalde: Record<string, number> = {
    fixo: 0,
    prioridade: 0,
    estilo_vida: 0,
  };
  let semClassificacao = 0;
  let receitaDoMes = 0;

  for (const l of lancamentos) {
    const m = Number(l.data.slice(5, 7)) - 1;
    const valor = Number(l.valor);

    if (l.tipo === 'entrada') {
      receitaPorMes[m] += valor;
      if (m === mes - 1) receitaDoMes += valor;
      continue;
    }

    despesaPorMes[m] += valor;

    if (m !== mes - 1) continue;

    const classe = l.area_id ? classificacaoDaArea.get(l.area_id) : null;

    // Área sem balde (como Ajustes) não entra na proporção: ela existe
    // fora do método de propósito, e somá-la distorceria os três.
    if (classe && classe in porBalde) {
      porBalde[classe] += valor;
    } else {
      semClassificacao += valor;
    }
  }

  const baldes: Balde[] = (['fixo', 'prioridade', 'estilo_vida'] as const).map(
    (chave) => ({
      chave,
      rotulo: ROTULOS[chave],
      valor: porBalde[chave],
      meta: METAS[chave],
      percentual:
        receitaDoMes > 0
          ? Math.round((porBalde[chave] / receitaDoMes) * 1000) / 10
          : 0,
    })
  );

  const meses: MesDoAno[] = receitaPorMes.map((receita, i) => {
    const economia = receita - despesaPorMes[i];
    return {
      mes: i + 1,
      receita,
      despesa: despesaPorMes[i],
      economia,
      // Sem receita não há taxa: dividir por zero daria infinito, e um mês
      // sem entrada não tem "percentual economizado" nenhum.
      taxa: receita > 0 ? Math.round((economia / receita) * 1000) / 10 : null,
    };
  });

  return (
    <PainelRelatorios
      ano={ano}
      mes={mes}
      baldes={baldes}
      receitaDoMes={receitaDoMes}
      despesaDoMes={despesaPorMes[mes - 1]}
      semClassificacao={semClassificacao}
      meses={meses}
      erro={lancRes.error?.message ?? null}
    />
  );
}
