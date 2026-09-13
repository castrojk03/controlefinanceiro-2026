import { createClient } from '@/lib/supabase/server';
import {
  PainelCalendario,
  type DiaDoCalendario,
  type VencimentoDoDia,
} from '@/components/calendario/PainelCalendario';
import { cicloDoMes } from '@/lib/fatura';
import type { Cartao, Lancamento } from '@/types/financeiro';

/**
 * Calendário — o mês numa grade, com passado e futuro juntos.
 *
 * Duas informações em canais visuais diferentes, como o wireframe definiu:
 * o preenchimento da célula mostra o gasto daquele dia (conta e cartão
 * somados, o almoço de R$ 27 no crédito incluído), e a borda marca que há
 * conta vencendo ali.
 *
 * A separação importa porque as duas coisas não coincidem: a compra de
 * 11/09 no cartão é gasto do dia 11, mas o dinheiro sai em 13/10 — que
 * aparece como vencimento, não como gasto.
 */
function iso(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export default async function PaginaCalendario({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string; dia?: string }>;
}) {
  const { mes: mesParam, ano: anoParam, dia: diaParam } = await searchParams;

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

  const [cartoesRes, lancRes] = await Promise.all([
    supabase.from('cards').select('*').eq('type', 'Crédito').order('name'),
    supabase
      .from('lancamentos')
      .select('*')
      .eq('transferencia_interna', false)
      .gte('data', iso(primeiro))
      .lte('data', iso(ultimo))
      .order('data'),
  ]);

  const cartoes = (cartoesRes.data ?? []) as Cartao[];
  const lancamentos = (lancRes.data ?? []) as Lancamento[];

  // ----------------------------------------------------------------
  // As faturas que vencem neste mês — o mesmo cálculo do Painel Diário
  // ----------------------------------------------------------------
  const faturasPorDia = new Map<string, VencimentoDoDia[]>();

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
        .select('status, total, total_ajustado, saldo_anterior, valor_pago')
        .eq('cartao_id', cartao.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle(),
    ]);

    const reg = registroRes.data;
    const somado = (comprasRes.data ?? []).reduce(
      (s, l) => s + Number(l.valor),
      0
    );

    const total =
      Number(reg?.total_ajustado ?? reg?.total ?? somado) +
      Number(reg?.saldo_anterior ?? 0) -
      Number(reg?.status === 'parcial' ? reg.valor_pago : 0);

    if (total <= 0) continue;

    const lista = faturasPorDia.get(ciclo.vencimento) ?? [];
    lista.push({
      descricao: `Fatura ${cartao.name}`,
      valor: total,
      pago: reg?.status === 'paga',
      ehFatura: true,
    });
    faturasPorDia.set(ciclo.vencimento, lista);
  }

  // ----------------------------------------------------------------
  // O mês, dia a dia
  // ----------------------------------------------------------------
  const porDia = new Map<string, Lancamento[]>();
  for (const l of lancamentos) {
    const lista = porDia.get(l.data) ?? [];
    lista.push(l);
    porDia.set(l.data, lista);
  }

  const hojeISO = iso(agora);
  const dias: DiaDoCalendario[] = [];

  for (let d = 1; d <= ultimo.getDate(); d++) {
    const data = iso(new Date(ano, mes - 1, d));
    const doDia = porDia.get(data) ?? [];

    const entrada = doDia
      .filter((l) => l.tipo === 'entrada')
      .reduce((s, l) => s + Number(l.valor), 0);

    // Gasto do dia: conta e cartão. É o que a célula mostra.
    const gasto = doDia
      .filter((l) => l.tipo === 'saida')
      .reduce((s, l) => s + Number(l.valor), 0);

    // Vencimentos: contas que saem da conta naquele dia, mais as faturas.
    // O que é do cartão não vence aqui — vence com a fatura.
    const vencimentos: VencimentoDoDia[] = doDia
      .filter((l) => l.tipo === 'saida' && !l.cartao_id && l.conta_id)
      .map((l) => ({
        descricao: l.descricao,
        valor: Number(l.valor),
        pago: l.status === 'pago',
        ehFatura: false,
      }));

    vencimentos.push(...(faturasPorDia.get(data) ?? []));

    dias.push({
      data,
      dia: d,
      diaDaSemana: new Date(ano, mes - 1, d).getDay(),
      entrada,
      gasto,
      vencimentos,
      ehHoje: data === hojeISO,
      lancamentos: doDia,
    });
  }

  const diaAberto =
    diaParam && Number(diaParam) >= 1 && Number(diaParam) <= ultimo.getDate()
      ? Number(diaParam)
      : null;

  return (
    <PainelCalendario
      dias={dias}
      mes={mes}
      ano={ano}
      diaAberto={diaAberto}
      erro={lancRes.error?.message ?? null}
    />
  );
}
