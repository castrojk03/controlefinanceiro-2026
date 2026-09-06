'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Resultado = { erro: string } | { ok: true };

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('pago_tem_data')) {
    return 'Um lançamento pago precisa de data de pagamento.';
  }
  if (mensagem.includes('violates check constraint "lancamentos_valor_check"')) {
    return 'O valor precisa ser maior que zero.';
  }
  if (mensagem.includes('violates foreign key')) {
    return 'A conta, cartão ou categoria escolhida não existe mais.';
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

function lerFormulario(formData: FormData) {
  const tipo = String(formData.get('tipo') ?? 'saida') as 'entrada' | 'saida';
  const ehEntrada = tipo === 'entrada';
  const status = String(formData.get('status') ?? 'pago') as
    | 'previsto'
    | 'pendente'
    | 'pago';

  return {
    tipo,
    status,
    descricao: String(formData.get('descricao') ?? '').trim(),
    valor: paraNumero(formData.get('valor')),
    data: String(formData.get('data') ?? ''),
    data_pagamento:
      status === 'pago'
        ? String(formData.get('data_pagamento') ?? '') ||
          String(formData.get('data') ?? '')
        : null,
    // Entrada tem origem; saída tem área e categoria. Preencher os dois
    // lados faria a receita aparecer nos relatórios de gasto.
    area_id: ehEntrada ? null : String(formData.get('area_id') ?? '') || null,
    categoria_id: ehEntrada
      ? null
      : String(formData.get('categoria_id') ?? '') || null,
    origem_id: ehEntrada ? String(formData.get('origem_id') ?? '') || null : null,
    conta_id: String(formData.get('conta_id') ?? '') || null,
    cartao_id: ehEntrada ? null : String(formData.get('cartao_id') ?? '') || null,
    responsavel: String(formData.get('responsavel') ?? 'casal') as
      | 'john'
      | 'amanda'
      | 'casal',
  };
}

function validar(d: ReturnType<typeof lerFormulario>): string | null {
  if (!d.descricao) return 'Informe a descrição.';
  if (d.valor <= 0) return 'O valor precisa ser maior que zero.';
  if (!d.data) return 'Informe a data.';
  if (d.tipo === 'entrada' && !d.origem_id) return 'Escolha a origem da receita.';
  if (d.status === 'pago' && !d.conta_id && !d.cartao_id) {
    return 'Informe de onde saiu ou entrou o dinheiro.';
  }
  return null;
}

/** Move o saldo da conta na direção do lançamento. */
async function ajustarSaldo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contaId: string,
  delta: number
) {
  const { data: conta } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', contaId)
    .single();

  if (conta) {
    await supabase
      .from('accounts')
      .update({ balance: Number(conta.balance) + delta })
      .eq('id', contaId);
  }
}

export async function criarLancamento(formData: FormData): Promise<Resultado> {
  const dados = lerFormulario(formData);

  const problema = validar(dados);
  if (problema) return { erro: problema };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sessão expirada. Entre novamente.' };

  const { error } = await supabase.from('lancamentos').insert({
    ...dados,
    user_id: user.id,
    valor_previsto: dados.valor,
    origem: 'manual',
  });

  if (error) {
    console.error('[lancamentos] falha ao criar:', error);
    return { erro: traduzirErro(error.message) };
  }

  // Compra no cartão não mexe no saldo: entra na fatura e sai da conta só
  // no vencimento do cartão.
  if (dados.status === 'pago' && dados.conta_id && !dados.cartao_id) {
    await ajustarSaldo(
      supabase,
      dados.conta_id,
      dados.tipo === 'entrada' ? dados.valor : -dados.valor
    );
  }

  revalidatePath('/lancamentos');
  revalidatePath('/');
  return { ok: true };
}

export async function atualizarLancamento(
  formData: FormData
): Promise<Resultado> {
  const id = String(formData.get('id') ?? '');
  if (!id) return { erro: 'Lançamento não identificado.' };

  const dados = lerFormulario(formData);
  const problema = validar(dados);
  if (problema) return { erro: problema };

  const supabase = await createClient();

  const { data: antes } = await supabase
    .from('lancamentos')
    .select('tipo, valor, status, conta_id, cartao_id')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('lancamentos')
    .update({
      ...dados,
      // Editado à mão deixa de acompanhar a regra que o gerou.
      desligado_da_regra: true,
      editado_em: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[lancamentos] falha ao atualizar:', error);
    return { erro: traduzirErro(error.message) };
  }

  // Desfaz o efeito antigo no saldo e aplica o novo, para a edição não
  // deixar a conta com valor errado.
  if (antes?.status === 'pago' && antes.conta_id && !antes.cartao_id) {
    await ajustarSaldo(
      supabase,
      antes.conta_id,
      antes.tipo === 'entrada' ? -Number(antes.valor) : Number(antes.valor)
    );
  }
  if (dados.status === 'pago' && dados.conta_id && !dados.cartao_id) {
    await ajustarSaldo(
      supabase,
      dados.conta_id,
      dados.tipo === 'entrada' ? dados.valor : -dados.valor
    );
  }

  revalidatePath('/lancamentos');
  revalidatePath('/');
  return { ok: true };
}

export async function excluirLancamento(id: string): Promise<Resultado> {
  const supabase = await createClient();

  const { data: antes } = await supabase
    .from('lancamentos')
    .select('tipo, valor, status, conta_id, cartao_id')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('lancamentos').delete().eq('id', id);

  if (error) {
    console.error('[lancamentos] falha ao excluir:', error);
    return { erro: traduzirErro(error.message) };
  }

  if (antes?.status === 'pago' && antes.conta_id && !antes.cartao_id) {
    await ajustarSaldo(
      supabase,
      antes.conta_id,
      antes.tipo === 'entrada' ? -Number(antes.valor) : Number(antes.valor)
    );
  }

  revalidatePath('/lancamentos');
  revalidatePath('/');
  return { ok: true };
}
