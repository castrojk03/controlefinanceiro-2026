import { createClient } from '@/lib/supabase/server';
import { PainelDiario, type DiaDoMes, type FaturaDoDia } from '@/components/diario/PainelDiario';
import { cicloDoMes } from '@/lib/fatura';
import type { Conta, Cartao, Lancamento } from '@/types/financeiro';

/**
 * Painel Diário — o Termômetro do Breno.
 *
 * A tela responde duas perguntas que a planilha do Breno mantinha juntas e
 * que o cartão de crédito separa:
 *
 *   "quanto gastei hoje?"      → gasto do dia, conta e cartão somados
 *   "o que sai da conta, e quando?" → só o que toca o dinheiro
 *
 * O almoço de R$ 27 no cartão é gasto do dia 8; o dinheiro dele só sai em
 * 13/10, junto com o resto da fatura. Misturar as duas coisas numa coluna
 * só faria o saldo mentir — ou debitando o cartão no dia da compra, ou
 * nunca.
 *
 * O saldo corre apenas sobre o que sai da conta, e a fatura entra nele
 * como uma linha só, no vencimento.
 */
const ANCORA = '2026-09-13';

function iso(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export default async function PaginaPainelDiario({
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

  const supabase = await createClient();

  const primeiro = new Date(ano, mes - 1, 1);
  const ultimo = new Date(ano, mes, 0);

  const [contasRes, cartoesRes, lancRes] = await Promise.all([
    supabase.from('accounts').select('*').order('name'),
    supabase.from('cards').select('*').eq('type', 'Crédito').order('name'),
    // Transferência entre as contas do casal fica de fora: move dinheiro de
    // um bolso para o outro e faria o dia parecer movimentado à toa.
    supabase
      .from('lancamentos')
      .select('*')
      .eq('transferencia_interna', false)
      .gte('data', iso(primeiro))
      .lte('data', iso(ultimo))
      .order('data'),
  ]);

  const contas = (contasRes.data ?? []) as Conta[];
  const cartoes = (cartoesRes.data ?? []) as Cartao[];
  const lancamentos = (lancRes.data ?? []) as Lancamento[];

  const saldoHoje = contas.reduce((s, c) => s + Number(c.balance), 0);
  const hojeISO = iso(agora);

  // --------------------------------------------------------------
  // As faturas que vencem neste mês
  // --------------------------------------------------------------
  // Linhas virtuais: calculadas a partir do ciclo do cartão, existam ou
  // não na tabela faturas. É o que permite ver a fatura de novembro hoje,
  // antes de ela sequer ter fechado — a previsão que a tela promete.
  const faturasPorDia = new Map<string, FaturaDoDia[]>();

  for (const cartao of cartoes) {
    if (!cartao.closing_day || !cartao.due_day) continue;

    const ciclo = cicloDoMes(mes, ano, cartao.closing_day, cartao.due_day);

    const [comprasRes, registroRes] = await Promise.all([
      supabase
        .from('lancamentos')
        .select('valor')
        .eq('cartao_id', cartao.id)
        .gte('data', ciclo.inicio)
        .lte('data', ciclo.fim),
      supabase
        .from('faturas')
        .select('status, total, total_ajustado, saldo_anterior, valor_pago, fechada_em')
        .eq('cartao_id', cartao.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle(),
    ]);

    const somado = (comprasRes.data ?? []).reduce(
      (s, l) => s + Number(l.valor),
      0
    );
    const reg = registroRes.data;

    // Fatura paga já saiu da conta: o saldo de hoje a reflete, e somá-la
    // de novo a cobraria duas vezes.
    if (reg?.status === 'paga') continue;

    const total =
      Number(reg?.total_ajustado ?? reg?.total ?? somado) +
      Number(reg?.saldo_anterior ?? 0) -
      Number(reg?.status === 'parcial' ? reg.valor_pago : 0);

    if (total <= 0) continue;

    const lista = faturasPorDia.get(ciclo.vencimento) ?? [];
    lista.push({ cartao: cartao.name, valor: total, fechada: !!reg?.fechada_em });
    faturasPorDia.set(ciclo.vencimento, lista);
  }

  // --------------------------------------------------------------
  // O mês, dia a dia
  // --------------------------------------------------------------
  const porDia = new Map<string, Lancamento[]>();
  for (const l of lancamentos) {
    const lista = porDia.get(l.data) ?? [];
    lista.push(l);
    porDia.set(l.data, lista);
  }

  const dias: DiaDoMes[] = [];
  let acumulado = saldoHoje;

  for (let d = 1; d <= ultimo.getDate(); d++) {
    const data = iso(new Date(ano, mes - 1, d));
    const doDia = porDia.get(data) ?? [];
    const faturas = faturasPorDia.get(data) ?? [];

    const entrada = doDia
      .filter((l) => l.tipo === 'entrada')
      .reduce((s, l) => s + Number(l.valor), 0);

    const saidas = doDia.filter((l) => l.tipo === 'saida');

    // Gasto do dia: tudo que foi gasto, na conta ou no cartão. Responde
    // "quanto torrei hoje" — inclusive o almoço de R$ 27 no crédito.
    const gastoDoDia = saidas.reduce((s, l) => s + Number(l.valor), 0);

    // Saiu da conta: só o que tocou o dinheiro, mais a fatura do dia.
    const saiuDaConta =
      saidas
        .filter((l) => !l.cartao_id && l.conta_id)
        .reduce((s, l) => s + Number(l.valor), 0) +
      faturas.reduce((s, f) => s + f.valor, 0);

    // O saldo só corre de hoje em diante: antes disso não foi medido, e
    // mostrar valor reconstruído daria falsa precisão.
    const projetavel = data >= hojeISO && data >= ANCORA;
    if (projetavel && data > hojeISO) {
      acumulado = acumulado + entrada - saiuDaConta;
    }

    dias.push({
      data,
      diaDaSemana: new Date(ano, mes - 1, d).getDay(),
      entrada,
      gastoDoDia,
      saiuDaConta,
      saldo: projetavel ? acumulado : null,
      ehHoje: data === hojeISO,
      lancamentos: doDia,
      faturas,
    });
  }

  return (
    <PainelDiario
      dias={dias}
      mes={mes}
      ano={ano}
      entrouNoMes={dias.reduce((s, d) => s + d.entrada, 0)}
      gastoNoMes={dias.reduce((s, d) => s + d.gastoDoDia, 0)}
      saldoHoje={saldoHoje}
      hoje={hojeISO}
      erro={lancRes.error?.message ?? null}
    />
  );
}
