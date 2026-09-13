import { createClient } from '@/lib/supabase/server';
import { PainelInicio } from '@/components/inicio/PainelInicio';
import type { Conta, Cartao, Lancamento } from '@/types/financeiro';

/**
 * Início — a tela que responde "quanto tenho e o que vence".
 *
 * A janela de vencimentos vem por parâmetro (7, 15 ou 30 dias) para que a
 * escolha sobreviva a um recarregamento e possa ser compartilhada por link.
 */
export default async function PaginaInicio({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias } = await searchParams;
  const janela = [7, 15, 30].includes(Number(dias)) ? Number(dias) : 7;

  const supabase = await createClient();

  const hoje = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const limiteJanela = new Date(hoje);
  limiteJanela.setDate(limiteJanela.getDate() + janela);

  const primeiroDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const [contasRes, cartoesRes, mesRes, venceRes, ultimosRes, atrasadosRes] =
    await Promise.all([
      supabase.from('accounts').select('*').order('name'),
      supabase.from('cards').select('*').order('name'),
      // Movimento do mês corrente, para receitas e despesas.
      // Transferência entre as contas do casal fica de fora: move saldo,
      // mas não é dinheiro entrando nem saindo do bolso dos dois.
      supabase
        .from('lancamentos')
        .select('tipo, valor, status')
        .eq('transferencia_interna', false)
        .gte('data', iso(primeiroDoMes))
        .lte('data', iso(ultimoDoMes)),
      // O que vence na janela e ainda não foi pago.
      // Mesmo critério do bloco de vencidos: o total desta lista se lê
      // como "o que preciso pagar", e nem compra no cartão nem acerto com
      // terceiro se pagam aqui. O que o cartão deve aparece na tela de
      // Faturas.
      supabase
        .from('lancamentos')
        .select('*')
        .neq('status', 'pago')
        .not('conta_id', 'is', null)
        .gte('data', iso(hoje))
        .lte('data', iso(limiteJanela))
        .order('data'),
      // Últimos lançamentos, para dar sinal de vida à tela.
      // Sem acerto de abertura nem transferência entre o casal: nenhum dos
      // dois é um pagamento que alguém fez, e ver "Acerto de abertura ·
      // R$ 4.989,90" no topo da lista faz parecer que o dinheiro saiu.
      supabase
        .from('lancamentos')
        .select('*')
        .eq('status', 'pago')
        .eq('transferencia_interna', false)
        .order('data_pagamento', { ascending: false })
        .limit(5),
      // Vencidos e não pagos — o que não pode passar despercebido.
      // Só o que sai de uma conta da casa. Fica de fora a despesa de
      // cartão, cuja data é a da compra e não a de um vencimento (compra
      // de 11/set no cartão que fecha dia 5 vence em 13/out, com a
      // fatura), e o acerto com terceiro, como a parcela no cartão de
      // outra pessoa: não é conta que vence, é dívida com alguém.
      // Chamar qualquer um dos dois de atrasado é o sistema mentindo
      // sobre a situação de quem olha.
      supabase
        .from('lancamentos')
        .select('*')
        .neq('status', 'pago')
        .not('conta_id', 'is', null)
        .lt('data', iso(hoje))
        .order('data'),
    ]);

  const contas = (contasRes.data ?? []) as Conta[];
  const cartoes = (cartoesRes.data ?? []) as Cartao[];
  const doMes = (mesRes.data ?? []) as Pick<
    Lancamento,
    'tipo' | 'valor' | 'status'
  >[];

  const saldoTotal = contas.reduce((s, c) => s + Number(c.balance), 0);

  const receitasMes = doMes
    .filter((l) => l.tipo === 'entrada')
    .reduce((s, l) => s + Number(l.valor), 0);

  const despesasMes = doMes
    .filter((l) => l.tipo === 'saida')
    .reduce((s, l) => s + Number(l.valor), 0);

  return (
    <PainelInicio
      contas={contas}
      cartoes={cartoes}
      saldoTotal={saldoTotal}
      receitasMes={receitasMes}
      despesasMes={despesasMes}
      vencimentos={(venceRes.data ?? []) as Lancamento[]}
      atrasados={(atrasadosRes.data ?? []) as Lancamento[]}
      ultimos={(ultimosRes.data ?? []) as Lancamento[]}
      janela={janela}
      erro={venceRes.error?.message ?? contasRes.error?.message ?? null}
    />
  );
}
