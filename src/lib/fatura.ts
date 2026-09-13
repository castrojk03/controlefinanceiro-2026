/**
 * O ciclo do cartão.
 *
 * O corte é o dia de fechamento, não o mês da compra — é a fonte de confusão
 * mais comum no cartão de crédito. Com fechamento dia 5 e vencimento dia 13:
 * uma compra em 4/set entra na fatura que vence 13/set; uma em 6/set só cai
 * na de outubro.
 */

export interface CicloFatura {
  /** Mês de referência da fatura (1-12), pelo vencimento. */
  mes: number;
  ano: number;
  /** Primeiro dia de compras que entram nesta fatura. */
  inicio: string;
  /** Último dia — o próprio dia de fechamento. */
  fim: string;
  /** Quando fecha e quando vence. */
  fechamento: string;
  vencimento: string;
}

function iso(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Um dia pode não existir no mês (dia 31 em abril). Nesses casos cai no
 * último dia do mês, em vez de vazar para o mês seguinte.
 */
function diaDoMes(ano: number, mes: number, dia: number): Date {
  const ultimo = new Date(ano, mes + 1, 0).getDate();
  return new Date(ano, mes, Math.min(dia, ultimo));
}

/**
 * O ciclo a que uma data pertence.
 *
 * `fechamento` e `vencimento` são os dias configurados no cartão.
 */
export function cicloDaData(
  data: string,
  diaFechamento: number,
  diaVencimento: number
): CicloFatura {
  const [ano, mes, dia] = data.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);

  // Depois do fechamento, a compra pertence ao ciclo seguinte.
  const passouDoFechamento = d.getDate() > diaFechamento;
  const mesCiclo = passouDoFechamento ? d.getMonth() + 1 : d.getMonth();

  const fechamento = diaDoMes(d.getFullYear(), mesCiclo, diaFechamento);

  // O ciclo começa no dia seguinte ao fechamento anterior.
  const fechamentoAnterior = diaDoMes(
    d.getFullYear(),
    mesCiclo - 1,
    diaFechamento
  );
  const inicio = new Date(fechamentoAnterior);
  inicio.setDate(inicio.getDate() + 1);

  // Vencimento no mesmo mês do fechamento quando cai depois dele; no mês
  // seguinte quando cai antes (fecha dia 28, vence dia 5). O cálculo parte
  // do fechamento já resolvido — recalcular a partir do ano faria o ano
  // avançar duas vezes na virada de dezembro.
  const vencimento = diaDoMes(
    fechamento.getFullYear(),
    fechamento.getMonth() + (diaVencimento > diaFechamento ? 0 : 1),
    diaVencimento
  );

  return {
    mes: vencimento.getMonth() + 1,
    ano: vencimento.getFullYear(),
    inicio: iso(inicio),
    fim: iso(fechamento),
    fechamento: iso(fechamento),
    vencimento: iso(vencimento),
  };
}

/** O ciclo de um mês de referência específico. */
export function cicloDoMes(
  mes: number,
  ano: number,
  diaFechamento: number,
  diaVencimento: number
): CicloFatura {
  // Parte do vencimento e anda para trás até o fechamento do ciclo.
  const vencimento = diaDoMes(ano, mes - 1, diaVencimento);

  const mesFechamento =
    diaVencimento > diaFechamento ? mes - 1 : mes - 2;
  const fechamento = diaDoMes(ano, mesFechamento, diaFechamento);

  const fechamentoAnterior = diaDoMes(ano, mesFechamento - 1, diaFechamento);
  const inicio = new Date(fechamentoAnterior);
  inicio.setDate(inicio.getDate() + 1);

  return {
    mes,
    ano,
    inicio: iso(inicio),
    fim: iso(fechamento),
    fechamento: iso(fechamento),
    vencimento: iso(vencimento),
  };
}

/** Situação do ciclo em relação a hoje. */
export function situacaoDoCiclo(
  ciclo: CicloFatura,
  hoje = new Date()
): 'aberta' | 'fechada' | 'vencida' {
  const hojeISO = iso(hoje);
  if (hojeISO <= ciclo.fechamento) return 'aberta';
  if (hojeISO <= ciclo.vencimento) return 'fechada';
  return 'vencida';
}

/** "6 ago — 5 set" */
export function periodoLegivel(ciclo: CicloFatura): string {
  const meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ];
  const fmt = (isoData: string) => {
    const [, m, d] = isoData.split('-').map(Number);
    return `${d} ${meses[m - 1]}`;
  };
  return `${fmt(ciclo.inicio)} — ${fmt(ciclo.fim)}`;
}
