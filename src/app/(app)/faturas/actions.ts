'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cicloDoMes } from '@/lib/fatura';
import { paraNumero } from '@/lib/valor';

type Resultado = { erro: string } | { ok: true };

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) {
    return 'Senha incorreta.';
  }
  if (mensagem.includes('row-level security')) {
    return 'Sem permissão para essa operação.';
  }
  return mensagem;
}


/**
 * Garante que a fatura de um ciclo exista, com o total somado a partir dos
 * lançamentos daquele período.
 *
 * Chamada ao abrir a tela: as faturas nascem e fecham sozinhas, como o fluxo
 * 4 definiu. O total é sempre recalculado enquanto a fatura está aberta, e
 * congela no fechamento — é o que torna fatura fechada um fato, não uma
 * consulta que muda se um lançamento for editado depois.
 */
export async function garantirFatura(
  cartaoId: string,
  mes: number,
  ano: number,
  diaFechamento: number,
  diaVencimento: number
): Promise<{ erro: string } | { ok: true; id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sessão expirada. Entre novamente.' };

  const ciclo = cicloDoMes(mes, ano, diaFechamento, diaVencimento);
  const hoje = new Date().toISOString().slice(0, 10);
  const jaFechou = hoje > ciclo.fechamento;

  const { data: existente } = await supabase
    .from('faturas')
    .select('*')
    .eq('cartao_id', cartaoId)
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle();

  // Fatura paga não se mexe mais.
  if (existente?.status === 'paga') return { ok: true, id: existente.id };

  const { data: doCiclo } = await supabase
    .from('lancamentos')
    .select('valor')
    .eq('cartao_id', cartaoId)
    .gte('data', ciclo.inicio)
    .lte('data', ciclo.fim);

  const total = (doCiclo ?? []).reduce((s, l) => s + Number(l.valor), 0);

  if (!existente) {
    const { data: nova, error } = await supabase
      .from('faturas')
      .insert({
        user_id: user.id,
        cartao_id: cartaoId,
        mes,
        ano,
        total,
        status: jaFechou ? 'fechada' : 'aberta',
        fechada_em: jaFechou ? ciclo.fechamento : null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[faturas] falha ao criar:', error);
      return { erro: traduzirErro(error.message) };
    }
    return { ok: true, id: nova.id };
  }

  // Enquanto aberta, o total acompanha os lançamentos. Fechada, congela —
  // salvo o momento em que o ciclo acabou de virar.
  if (existente.status === 'aberta') {
    await supabase
      .from('faturas')
      .update({
        total,
        status: jaFechou ? 'fechada' : 'aberta',
        fechada_em: jaFechou ? ciclo.fechamento : null,
      })
      .eq('id', existente.id);
  }

  return { ok: true, id: existente.id };
}

/**
 * Paga a fatura — total ou parcialmente.
 *
 * No pagamento integral, os lançamentos dentro dela viram "pago": se a
 * fatura foi quitada, as compras que ela reúne foram pagas junto.
 *
 * No parcial, o que sobrou vira saldo da fatura seguinte. Os juros não são
 * calculados: vêm no boleto e são lançados à mão, porque cada cartão tem
 * sua regra.
 */
export async function pagarFatura(formData: FormData): Promise<Resultado> {
  const id = String(formData.get('id') ?? '');
  const valor = paraNumero(formData.get('valor'));
  const contaId = String(formData.get('conta_id') ?? '');
  const data = String(formData.get('data_pagamento') ?? '');

  if (!id) return { erro: 'Fatura não identificada.' };
  if (valor <= 0) return { erro: 'O valor precisa ser maior que zero.' };
  if (!contaId) return { erro: 'Escolha de qual conta saiu.' };
  if (!data) return { erro: 'Informe a data do pagamento.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sessão expirada. Entre novamente.' };

  const { data: fatura } = await supabase
    .from('faturas')
    .select('*')
    .eq('id', id)
    .single();

  if (!fatura) return { erro: 'Fatura não encontrada.' };
  if (fatura.status === 'paga') return { erro: 'Essa fatura já foi paga.' };

  const devido =
    Number(fatura.total_ajustado ?? fatura.total) + Number(fatura.saldo_anterior);
  const restante = Math.round((devido - valor) * 100) / 100;
  const integral = restante <= 0;

  const { error: erroFat } = await supabase
    .from('faturas')
    .update({
      status: integral ? 'paga' : 'parcial',
      valor_pago: valor,
      data_pagamento: data,
      conta_pagamento_id: contaId,
    })
    .eq('id', id);

  if (erroFat) {
    console.error('[faturas] falha ao pagar:', erroFat);
    return { erro: traduzirErro(erroFat.message) };
  }

  // O dinheiro sai da conta agora — é aqui que a compra no cartão finalmente
  // toca o saldo.
  const { data: conta } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', contaId)
    .single();

  if (conta) {
    await supabase
      .from('accounts')
      .update({ balance: Number(conta.balance) - valor })
      .eq('id', contaId);
  }

  if (integral) {
    await supabase
      .from('lancamentos')
      .update({ status: 'pago', data_pagamento: data })
      .eq('cartao_id', fatura.cartao_id)
      .eq('fatura_id', id)
      .neq('status', 'pago');
  } else {
    // Leva o restante para a fatura seguinte, criando-a se ainda não existir.
    const proxMes = fatura.mes === 12 ? 1 : fatura.mes + 1;
    const proxAno = fatura.mes === 12 ? fatura.ano + 1 : fatura.ano;

    const { data: seguinte } = await supabase
      .from('faturas')
      .select('id, saldo_anterior')
      .eq('cartao_id', fatura.cartao_id)
      .eq('mes', proxMes)
      .eq('ano', proxAno)
      .maybeSingle();

    if (seguinte) {
      await supabase
        .from('faturas')
        .update({ saldo_anterior: restante })
        .eq('id', seguinte.id);
    } else {
      await supabase.from('faturas').insert({
        user_id: user.id,
        cartao_id: fatura.cartao_id,
        mes: proxMes,
        ano: proxAno,
        saldo_anterior: restante,
        status: 'aberta',
      });
    }
  }

  revalidatePath('/faturas');
  revalidatePath('/');
  return { ok: true };
}

/**
 * Ajusta o valor de uma fatura fechada ou paga.
 *
 * Exige a senha: fatura fechada é registro contábil, e alterá-la depois
 * reescreve histórico. A fricção é proporcional ao risco — não se faz por
 * engano, mas se faz quando o banco cobra diferente do que o sistema
 * conhece (IOF, anuidade, juros).
 *
 * A diferença vira um lançamento próprio na categoria "Ajuste de Fatura",
 * em vez de sumir dentro do total.
 */
export async function ajustarFatura(formData: FormData): Promise<Resultado> {
  const id = String(formData.get('id') ?? '');
  const novoTotal = paraNumero(formData.get('total_ajustado'));
  const senha = String(formData.get('senha') ?? '');

  if (!id) return { erro: 'Fatura não identificada.' };
  if (novoTotal <= 0) return { erro: 'O valor precisa ser maior que zero.' };
  if (!senha) return { erro: 'Informe a senha para confirmar.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { erro: 'Sessão expirada. Entre novamente.' };

  // Revalida a senha antes de liberar a alteração
  const { error: erroSenha } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senha,
  });

  if (erroSenha) return { erro: traduzirErro(erroSenha.message) };

  const { data: fatura } = await supabase
    .from('faturas')
    .select('*')
    .eq('id', id)
    .single();

  if (!fatura) return { erro: 'Fatura não encontrada.' };

  const anterior = Number(fatura.total_ajustado ?? fatura.total);
  const diferenca = Math.round((novoTotal - anterior) * 100) / 100;

  const { error } = await supabase
    .from('faturas')
    .update({
      total_ajustado: novoTotal,
      editada_em: new Date().toISOString(),
      editada_por: user.id,
    })
    .eq('id', id);

  if (error) {
    console.error('[faturas] falha ao ajustar:', error);
    return { erro: traduzirErro(error.message) };
  }

  // Registra a diferença como lançamento visível, não como número solto
  if (diferenca !== 0) {
    const { data: categoria } = await supabase
      .from('categories')
      .select('id, area_id')
      .eq('name', 'Ajuste de Fatura')
      .maybeSingle();

    const ciclo = `${String(fatura.mes).padStart(2, '0')}/${fatura.ano}`;

    await supabase.from('lancamentos').insert({
      user_id: user.id,
      tipo: diferenca > 0 ? 'saida' : 'entrada',
      descricao: `Ajuste de fatura ${ciclo}`,
      valor: Math.abs(diferenca),
      valor_previsto: Math.abs(diferenca),
      data: new Date().toISOString().slice(0, 10),
      cartao_id: fatura.cartao_id,
      fatura_id: id,
      area_id: categoria?.area_id ?? null,
      categoria_id: categoria?.id ?? null,
      status: 'previsto',
      origem: 'manual',
      responsavel: 'casal',
    });
  }

  revalidatePath('/faturas');
  return { ok: true };
}
