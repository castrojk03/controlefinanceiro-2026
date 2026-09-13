import { createClient } from '@/lib/supabase/server';
import { PainelDiario, type DiaDoMes } from '@/components/diario/PainelDiario';
import type { Conta, Lancamento } from '@/types/financeiro';

/**
 * Painel Diário — o Termômetro do Breno.
 *
 * Enquanto o Plano de Contas responde "o que tenho a pagar e quando", este
 * responde "como estou hoje": o saldo corre dia a dia e mostra o aperto
 * antes de ele acontecer.
 *
 * O saldo parte do dia de hoje, com o que as contas de fato têm, e corre
 * para frente. Os dias já passados aparecem com seus lançamentos, mas sem
 * saldo: a gestão começou em 13/09/2026 e reconstruir o que veio antes
 * seria inventar precisão — o marco zero absorveu aquele histórico.
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

  const hoje = new Date();
  const mes = Number(mesParam) >= 1 && Number(mesParam) <= 12
    ? Number(mesParam)
    : hoje.getMonth() + 1;
  const ano = Number(anoParam) >= 2020 && Number(anoParam) <= 2100
    ? Number(anoParam)
    : hoje.getFullYear();

  const supabase = await createClient();

  const primeiro = new Date(ano, mes - 1, 1);
  const ultimo = new Date(ano, mes, 0);

  const [contasRes, lancRes] = await Promise.all([
    supabase.from('accounts').select('*').order('name'),
    // Transferência entre as contas do casal fica de fora: move saldo de um
    // bolso para o outro, e somá-la faria o dia parecer movimentado sem que
    // nada tenha entrado ou saído de fato.
    supabase
      .from('lancamentos')
      .select('*')
      .eq('transferencia_interna', false)
      .gte('data', iso(primeiro))
      .lte('data', iso(ultimo))
      .order('data'),
  ]);

  const contas = (contasRes.data ?? []) as Conta[];
  const lancamentos = (lancRes.data ?? []) as Lancamento[];

  const saldoHoje = contas.reduce((s, c) => s + Number(c.balance), 0);
  const hojeISO = iso(hoje);

  // Agrupa por dia antes de acumular: um dia pode ter vários lançamentos e
  // a linha mostra o efeito líquido deles.
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

    const entrada = doDia
      .filter((l) => l.tipo === 'entrada')
      .reduce((s, l) => s + Number(l.valor), 0);
    const saida = doDia
      .filter((l) => l.tipo === 'saida')
      .reduce((s, l) => s + Number(l.valor), 0);

    // O saldo só corre a partir de hoje: antes disso o número não foi
    // medido, e mostrar um valor reconstruído daria falsa precisão.
    const projetavel = data >= hojeISO && data >= ANCORA;
    if (projetavel && data > hojeISO) {
      acumulado = acumulado + entrada - saida;
    }

    dias.push({
      data,
      diaDaSemana: new Date(ano, mes - 1, d).getDay(),
      entrada,
      saida,
      saldo: projetavel ? acumulado : null,
      ehHoje: data === hojeISO,
      lancamentos: doDia,
    });
  }

  const entrouNoMes = lancamentos
    .filter((l) => l.tipo === 'entrada')
    .reduce((s, l) => s + Number(l.valor), 0);
  const saiuNoMes = lancamentos
    .filter((l) => l.tipo === 'saida')
    .reduce((s, l) => s + Number(l.valor), 0);

  return (
    <PainelDiario
      dias={dias}
      mes={mes}
      ano={ano}
      entrouNoMes={entrouNoMes}
      saiuNoMes={saiuNoMes}
      saldoHoje={saldoHoje}
      hoje={hojeISO}
      erro={lancRes.error?.message ?? null}
    />
  );
}
