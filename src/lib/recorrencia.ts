import type { FrequenciaRecorrencia, FimRecorrencia } from '@/types/financeiro';

/**
 * Gera as datas de uma recorrência.
 *
 * As ocorrências viram linhas reais em `lancamentos` no momento do cadastro —
 * decisão da fase 4. É isso que permite dar baixa numa parcela específica e
 * ligar cada vencimento a uma tarefa do Google.
 */

/** Janela padrão para recorrência sem fim definido. */
export const MESES_A_MATERIALIZAR = 24;

export interface RegraRecorrencia {
  frequencia: FrequenciaRecorrencia;
  intervalo: number;
  dias_semana?: number[] | null;
  dia_do_mes?: number | null;
  inicio: string;
  fim_tipo: FimRecorrencia;
  fim_data?: string | null;
  fim_ocorrencias?: number | null;
}

/** Data em ISO (AAAA-MM-DD), sem fuso — datas de vencimento não têm hora. */
function paraISO(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function deISO(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * Soma meses preservando o dia de vencimento.
 *
 * O caso que exige cuidado: vencimento dia 31 em meses de 30 dias. Aqui a
 * data cai no último dia do mês em vez de vazar para o mês seguinte — quem
 * vence dia 31 vence dia 30 em abril, não dia 1º de maio.
 */
function somarMeses(base: Date, meses: number, diaDesejado: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth() + meses, 1);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(diaDesejado, ultimoDia));
  return d;
}

/**
 * Devolve as datas da recorrência, em ordem.
 *
 * `ate` limita a geração para regras sem fim; por padrão, 24 meses.
 */
export function gerarOcorrencias(regra: RegraRecorrencia, ate?: Date): string[] {
  const inicio = deISO(regra.inicio);
  const intervalo = Math.max(1, regra.intervalo);

  const limite =
    ate ??
    new Date(
      inicio.getFullYear(),
      inicio.getMonth() + MESES_A_MATERIALIZAR,
      inicio.getDate()
    );

  const fimData = regra.fim_data ? deISO(regra.fim_data) : null;
  const maxOcorrencias =
    regra.fim_tipo === 'ocorrencias' && regra.fim_ocorrencias
      ? regra.fim_ocorrencias
      : Infinity;

  const datas: string[] = [];

  // Trava de segurança: uma regra malformada não pode gerar um laço infinito.
  const TETO = 2000;

  if (regra.frequencia === 'semanal') {
    const dias = regra.dias_semana?.length
      ? [...regra.dias_semana].sort((a, b) => a - b)
      : [inicio.getDay()];

    // Começa no domingo da semana de início, para varrer semana a semana.
    const cursor = new Date(inicio);
    cursor.setDate(cursor.getDate() - cursor.getDay());

    let semana = 0;
    while (datas.length < maxOcorrencias && datas.length < TETO) {
      if (semana % intervalo === 0) {
        for (const diaSemana of dias) {
          const d = new Date(cursor);
          d.setDate(d.getDate() + diaSemana);

          if (d < inicio) continue;
          if (d > limite) return datas;
          if (fimData && d > fimData) return datas;

          datas.push(paraISO(d));
          if (datas.length >= maxOcorrencias) return datas;
        }
      }
      cursor.setDate(cursor.getDate() + 7);
      semana++;
      if (cursor > limite) break;
    }
    return datas;
  }

  if (regra.frequencia === 'diaria') {
    const cursor = new Date(inicio);
    while (datas.length < maxOcorrencias && datas.length < TETO) {
      if (cursor > limite) break;
      if (fimData && cursor > fimData) break;
      datas.push(paraISO(cursor));
      cursor.setDate(cursor.getDate() + intervalo);
    }
    return datas;
  }

  // Mensal e anual compartilham a lógica: avançam N meses por vez.
  const passoEmMeses = regra.frequencia === 'anual' ? 12 * intervalo : intervalo;
  const diaAlvo = regra.dia_do_mes ?? inicio.getDate();

  let i = 0;
  while (datas.length < maxOcorrencias && i < TETO) {
    const d = somarMeses(inicio, passoEmMeses * i, diaAlvo);
    i++;

    if (d < inicio) continue;
    if (d > limite) break;
    if (fimData && d > fimData) break;

    datas.push(paraISO(d));
  }

  return datas;
}

/** Descreve a regra em uma frase, para conferência antes de salvar. */
export function descreverRecorrencia(regra: RegraRecorrencia): string {
  const { frequencia, intervalo, dia_do_mes } = regra;
  const cada = intervalo > 1 ? `a cada ${intervalo} ` : '';

  let base: string;
  switch (frequencia) {
    case 'diaria':
      base = intervalo > 1 ? `A cada ${intervalo} dias` : 'Todo dia';
      break;
    case 'semanal': {
      const nomes = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
      const dias = regra.dias_semana?.length
        ? regra.dias_semana.map((d) => nomes[d]).join(', ')
        : 'semana';
      base = intervalo > 1
        ? `A cada ${intervalo} semanas · ${dias}`
        : `Toda semana · ${dias}`;
      break;
    }
    case 'anual':
      base = intervalo > 1 ? `A cada ${intervalo} anos` : 'Todo ano';
      break;
    default:
      base = dia_do_mes
        ? `${cada ? `A cada ${intervalo} meses` : 'Todo mês'}, dia ${dia_do_mes}`
        : `${cada ? `A cada ${intervalo} meses` : 'Todo mês'}`;
  }

  switch (regra.fim_tipo) {
    case 'data':
      return `${base} · até ${regra.fim_data?.split('-').reverse().join('/')}`;
    case 'ocorrencias':
      return `${base} · ${regra.fim_ocorrencias} vezes`;
    default:
      return `${base} · sem prazo`;
  }
}
