'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Resultado = { erro: string } | { ok: true };

/** Traduz erros do Postgres para algo que a pessoa entenda e resolva. */
function traduzirErro(mensagem: string): string {
  if (mensagem.includes('duplicate key')) {
    return 'Já existe um registro com esse nome.';
  }
  if (mensagem.includes('violates foreign key')) {
    return 'Esse registro está em uso e não pode ser removido.';
  }
  if (mensagem.includes('Cartão de crédito deve ter limite')) {
    return 'Cartão de crédito precisa de limite maior que zero.';
  }
  if (mensagem.includes('row-level security')) {
    return 'Sem permissão para essa operação.';
  }
  return mensagem;
}

function paraNumero(valor: FormDataEntryValue | null): number {
  if (!valor) return 0;
  // Aceita "1.234,56" e "1234.56"
  const texto = String(valor).replace(/\./g, '').replace(',', '.');
  const n = Number(texto);
  return Number.isFinite(n) ? n : 0;
}

// ------------------------------------------------------------------
// CONTAS
// ------------------------------------------------------------------

export async function criarConta(formData: FormData): Promise<Resultado> {
  const nome = String(formData.get('nome') ?? '').trim();
  const cor = String(formData.get('cor') ?? '#3B6E8F');
  const saldo = paraNumero(formData.get('saldo'));

  if (!nome) return { erro: 'Informe o nome da conta.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sessão expirada. Entre novamente.' };

  const { error } = await supabase
    .from('accounts')
    .insert({ user_id: user.id, name: nome, color: cor, balance: saldo });

  if (error) return { erro: traduzirErro(error.message) };

  revalidatePath('/configuracoes');
  return { ok: true };
}

export async function atualizarConta(formData: FormData): Promise<Resultado> {
  const id = String(formData.get('id') ?? '');
  const nome = String(formData.get('nome') ?? '').trim();
  const cor = String(formData.get('cor') ?? '');
  const saldo = paraNumero(formData.get('saldo'));

  if (!id) return { erro: 'Conta não identificada.' };
  if (!nome) return { erro: 'Informe o nome da conta.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('accounts')
    .update({ name: nome, color: cor, balance: saldo })
    .eq('id', id);

  if (error) return { erro: traduzirErro(error.message) };

  revalidatePath('/configuracoes');
  return { ok: true };
}

export async function excluirConta(id: string): Promise<Resultado> {
  const supabase = await createClient();

  // Uma conta com lançamentos não some: perderia histórico sem aviso.
  const { count } = await supabase
    .from('lancamentos')
    .select('id', { count: 'exact', head: true })
    .eq('conta_id', id);

  if (count && count > 0) {
    return {
      erro: `Essa conta tem ${count} lançamento(s). Remova ou transfira antes de excluir.`,
    };
  }

  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) return { erro: traduzirErro(error.message) };

  revalidatePath('/configuracoes');
  return { ok: true };
}

// ------------------------------------------------------------------
// CARTÕES
// ------------------------------------------------------------------

export async function criarCartao(formData: FormData): Promise<Resultado> {
  const nome = String(formData.get('nome') ?? '').trim();
  const tipo = String(formData.get('tipo') ?? 'Crédito');
  const finais = String(formData.get('finais') ?? '').trim();
  const cor = String(formData.get('cor') ?? '#3B6E8F');
  const contaId = String(formData.get('conta_id') ?? '');
  const limite = paraNumero(formData.get('limite'));
  const fechamento = Number(formData.get('fechamento')) || null;
  const vencimento = Number(formData.get('vencimento')) || null;

  if (!nome) return { erro: 'Informe o nome do cartão.' };

  if (tipo === 'Crédito') {
    if (limite <= 0) return { erro: 'Cartão de crédito precisa de limite maior que zero.' };
    if (!fechamento) return { erro: 'Informe o dia de fechamento da fatura.' };
    if (!vencimento) return { erro: 'Informe o dia de vencimento da fatura.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sessão expirada. Entre novamente.' };

  const { error } = await supabase.from('cards').insert({
    user_id: user.id,
    name: nome,
    type: tipo,
    last_digits: finais || null,
    color: cor,
    account_id: contaId || null,
    credit_limit: limite,
    closing_day: fechamento,
    due_day: vencimento,
  });

  if (error) return { erro: traduzirErro(error.message) };

  revalidatePath('/configuracoes');
  return { ok: true };
}

export async function atualizarCartao(formData: FormData): Promise<Resultado> {
  const id = String(formData.get('id') ?? '');
  const nome = String(formData.get('nome') ?? '').trim();
  const tipo = String(formData.get('tipo') ?? 'Crédito');
  const finais = String(formData.get('finais') ?? '').trim();
  const cor = String(formData.get('cor') ?? '');
  const contaId = String(formData.get('conta_id') ?? '');
  const limite = paraNumero(formData.get('limite'));
  const fechamento = Number(formData.get('fechamento')) || null;
  const vencimento = Number(formData.get('vencimento')) || null;

  if (!id) return { erro: 'Cartão não identificado.' };
  if (!nome) return { erro: 'Informe o nome do cartão.' };

  if (tipo === 'Crédito') {
    if (limite <= 0) return { erro: 'Cartão de crédito precisa de limite maior que zero.' };
    if (!fechamento) return { erro: 'Informe o dia de fechamento da fatura.' };
    if (!vencimento) return { erro: 'Informe o dia de vencimento da fatura.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('cards')
    .update({
      name: nome,
      type: tipo,
      last_digits: finais || null,
      color: cor,
      account_id: contaId || null,
      credit_limit: limite,
      closing_day: fechamento,
      due_day: vencimento,
    })
    .eq('id', id);

  if (error) return { erro: traduzirErro(error.message) };

  revalidatePath('/configuracoes');
  return { ok: true };
}

export async function excluirCartao(id: string): Promise<Resultado> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('lancamentos')
    .select('id', { count: 'exact', head: true })
    .eq('cartao_id', id);

  if (count && count > 0) {
    return {
      erro: `Esse cartão tem ${count} lançamento(s). Remova ou transfira antes de excluir.`,
    };
  }

  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) return { erro: traduzirErro(error.message) };

  revalidatePath('/configuracoes');
  return { ok: true };
}
