'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Resultado = { erro: string } | { ok: true };

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('pago_tem_data')) {
    return 'Um pagamento precisa de data. Informe quando saiu.';
  }
  if (mensagem.includes('row-level security')) {
    return 'Sem permissão para essa operação.';
  }
  return mensagem;
}

function paraNumero(valor: FormDataEntryValue | null): number {
  if (!valor) return 0;
  const texto = String(valor).replace(/\./g, '').replace(',', '.');
  const n = Number(texto);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Dá baixa num vencimento.
 *
 * O valor é editável porque conta variável é a regra, não a exceção: luz,
 * gás e água mudam todo mês. Guardar o previsto e o real no mesmo registro
 * é o que alimenta o planejado × executado sem cadastro adicional.
 *
 * O saldo da conta é ajustado aqui — ele é um número gravado, não a soma
 * dos lançamentos, para permitir o ajuste manual.
 */
export async function pagarLancamento(formData: FormData): Promise<Resultado> {
  const id = String(formData.get('id') ?? '');
  const valor = paraNumero(formData.get('valor'));
  const forma = String(formData.get('forma') ?? 'conta');
  const contaId = String(formData.get('conta_id') ?? '');
  const cartaoId = String(formData.get('cartao_id') ?? '');
  const dataPagamento = String(formData.get('data_pagamento') ?? '');

  const noCartao = forma === 'cartao';

  if (!id) return { erro: 'Lançamento não identificado.' };
  if (valor <= 0) return { erro: 'O valor precisa ser maior que zero.' };
  if (!dataPagamento) return { erro: 'Informe a data.' };
  if (noCartao && !cartaoId) return { erro: 'Escolha o cartão.' };
  if (!noCartao && !contaId) return { erro: 'Escolha de qual conta saiu.' };

  const supabase = await createClient();

  const { data: lancamento, error: erroBusca } = await supabase
    .from('lancamentos')
    .select('id, tipo, valor, status')
    .eq('id', id)
    .single();

  if (erroBusca || !lancamento) {
    return { erro: 'Lançamento não encontrado.' };
  }
  if (lancamento.status === 'pago') {
    return { erro: 'Esse lançamento já foi pago.' };
  }

  const { error: erroUpd } = await supabase
    .from('lancamentos')
    .update({
      status: 'pago',
      valor,
      data_pagamento: dataPagamento,
      conta_id: noCartao ? null : contaId,
      cartao_id: noCartao ? cartaoId : null,
    })
    .eq('id', id);

  if (erroUpd) {
    console.error('[pagar] falha ao dar baixa:', erroUpd);
    return { erro: traduzirErro(erroUpd.message) };
  }

  // Compra no cartão não mexe no saldo: ela entra na fatura e sai da conta
  // só no vencimento do cartão. Debitar agora contaria o gasto duas vezes.
  if (!noCartao) {
    const { data: conta } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', contaId)
      .single();

    if (conta) {
      const delta = lancamento.tipo === 'entrada' ? valor : -valor;
      await supabase
        .from('accounts')
        .update({ balance: Number(conta.balance) + delta })
        .eq('id', contaId);
    }
  }

  revalidatePath('/');
  revalidatePath('/lancamentos');
  return { ok: true };
}

/**
 * Recalcula o saldo de uma conta a partir dos lançamentos pagos.
 *
 * O saldo é gravado para leitura rápida e ajuste manual, o que abre espaço
 * para divergência. Esta é a conferência que o fluxo previu: mostra a soma
 * real e deixa o John decidir se aceita.
 */
export async function conferirSaldo(
  contaId: string
): Promise<{ erro: string } | { ok: true; guardado: number; somado: number }> {
  const supabase = await createClient();

  const { data: conta, error: erroConta } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', contaId)
    .single();

  if (erroConta || !conta) return { erro: 'Conta não encontrada.' };

  const { data: pagos, error: erroLanc } = await supabase
    .from('lancamentos')
    .select('tipo, valor')
    .eq('conta_id', contaId)
    .eq('status', 'pago');

  if (erroLanc) return { erro: traduzirErro(erroLanc.message) };

  const somado = (pagos ?? []).reduce(
    (total, l) => total + (l.tipo === 'entrada' ? Number(l.valor) : -Number(l.valor)),
    0
  );

  return { ok: true, guardado: Number(conta.balance), somado };
}
