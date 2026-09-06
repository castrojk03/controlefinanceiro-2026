'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { gerarOcorrencias, type RegraRecorrencia } from '@/lib/recorrencia';

type Resultado = { erro: string } | { ok: true; criadas?: number };

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('fim_coerente')) {
    return 'Escolha como a recorrência termina: nunca, numa data ou após N vezes.';
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

/** Lê o formulário e monta a regra, sem tocar no banco. */
function lerFormulario(formData: FormData) {
  const diasSemana = formData
    .getAll('dias_semana')
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d));

  const fimTipo = String(formData.get('fim_tipo') ?? 'nunca') as
    | 'nunca'
    | 'data'
    | 'ocorrencias';

  return {
    tipo: String(formData.get('tipo') ?? 'saida') as 'entrada' | 'saida',
    descricao: String(formData.get('descricao') ?? '').trim(),
    valor: paraNumero(formData.get('valor')),
    valor_variavel: formData.get('valor_variavel') === 'on',
    area_id: String(formData.get('area_id') ?? '') || null,
    categoria_id: String(formData.get('categoria_id') ?? '') || null,
    conta_id: String(formData.get('conta_id') ?? '') || null,
    cartao_id: String(formData.get('cartao_id') ?? '') || null,
    responsavel: String(formData.get('responsavel') ?? 'casal') as
      | 'john'
      | 'amanda'
      | 'casal',
    frequencia: String(formData.get('frequencia') ?? 'mensal') as
      | 'diaria'
      | 'semanal'
      | 'mensal'
      | 'anual',
    intervalo: Math.max(1, Number(formData.get('intervalo')) || 1),
    dias_semana: diasSemana.length ? diasSemana : null,
    dia_do_mes: Number(formData.get('dia_do_mes')) || null,
    inicio: String(formData.get('inicio') ?? ''),
    fim_tipo: fimTipo,
    // Só o campo do fim escolhido é gravado. O banco recusa (fim_coerente)
    // um "nunca" que venha acompanhado de data ou número de vezes — e o
    // formulário mantém os três campos montados o tempo todo.
    fim_data: fimTipo === 'data' ? String(formData.get('fim_data') ?? '') || null : null,
    fim_ocorrencias:
      fimTipo === 'ocorrencias' ? Number(formData.get('fim_ocorrencias')) || null : null,
  };
}

function validar(dados: ReturnType<typeof lerFormulario>): string | null {
  if (!dados.descricao) return 'Informe a descrição.';
  if (dados.valor <= 0) return 'O valor precisa ser maior que zero.';
  if (!dados.inicio) return 'Informe a data de início.';
  if (dados.fim_tipo === 'data' && !dados.fim_data) {
    return 'Informe a data em que a recorrência termina.';
  }
  if (dados.fim_tipo === 'ocorrencias' && !dados.fim_ocorrencias) {
    return 'Informe quantas vezes a recorrência se repete.';
  }
  if (dados.frequencia === 'semanal' && !dados.dias_semana) {
    return 'Escolha ao menos um dia da semana.';
  }
  return null;
}

export async function criarRecorrencia(formData: FormData): Promise<Resultado> {
  const dados = lerFormulario(formData);

  const problema = validar(dados);
  if (problema) return { erro: problema };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sessão expirada. Entre novamente.' };

  // 1. Grava a regra
  const { data: regra, error: erroRegra } = await supabase
    .from('recorrencias')
    .insert({ ...dados, user_id: user.id })
    .select()
    .single();

  if (erroRegra) {
    console.error('[recorrencias] falha ao gravar a regra:', erroRegra);
    return { erro: traduzirErro(erroRegra.message) };
  }

  // 2. Materializa as ocorrências — é o que dá previsibilidade ao
  //    calendário e ao bloco "próximos 7 dias".
  const datas = gerarOcorrencias(dados as RegraRecorrencia);

  if (datas.length > 0) {
    const lancamentos = datas.map((data) => ({
      user_id: user.id,
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      valor_previsto: dados.valor,
      data,
      area_id: dados.area_id,
      categoria_id: dados.categoria_id,
      conta_id: dados.conta_id,
      cartao_id: dados.cartao_id,
      responsavel: dados.responsavel,
      status: 'previsto' as const,
      origem: 'manual' as const,
      recorrencia_id: regra.id,
    }));

    const { error: erroLanc } = await supabase
      .from('lancamentos')
      .insert(lancamentos);

    if (erroLanc) {
      console.error('[recorrencias] falha ao materializar as ocorrências:', {
        erro: erroLanc,
        quantidade: lancamentos.length,
        primeiro: lancamentos[0],
      });
      // A regra sem ocorrências não serve para nada: desfaz para não
      // deixar cadastro pela metade.
      await supabase.from('recorrencias').delete().eq('id', regra.id);
      return { erro: traduzirErro(erroLanc.message) };
    }

    await supabase
      .from('recorrencias')
      .update({ materializado_ate: datas[datas.length - 1] })
      .eq('id', regra.id);
  }

  revalidatePath('/recorrentes');
  revalidatePath('/');
  return { ok: true, criadas: datas.length };
}

/**
 * Encerra a recorrência a partir de uma data, sem apagar histórico.
 * As ocorrências futuras ainda não pagas são removidas; as pagas ficam.
 */
export async function encerrarRecorrencia(
  id: string,
  aPartirDe: string
): Promise<Resultado> {
  const supabase = await createClient();

  const { error: erroUpd } = await supabase
    .from('recorrencias')
    .update({ encerrada_em: aPartirDe })
    .eq('id', id);

  if (erroUpd) return { erro: traduzirErro(erroUpd.message) };

  const { error: erroDel } = await supabase
    .from('lancamentos')
    .delete()
    .eq('recorrencia_id', id)
    .neq('status', 'pago')
    .gte('data', aPartirDe);

  if (erroDel) return { erro: traduzirErro(erroDel.message) };

  revalidatePath('/recorrentes');
  revalidatePath('/');
  return { ok: true };
}

/** Remove a regra e tudo que ela gerou. Só quando nada foi pago. */
export async function excluirRecorrencia(id: string): Promise<Resultado> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('lancamentos')
    .select('id', { count: 'exact', head: true })
    .eq('recorrencia_id', id)
    .eq('status', 'pago');

  if (count && count > 0) {
    return {
      erro: `Essa recorrência já tem ${count} pagamento(s) registrado(s). Encerre em vez de excluir, para não perder o histórico.`,
    };
  }

  await supabase.from('lancamentos').delete().eq('recorrencia_id', id);

  const { error } = await supabase.from('recorrencias').delete().eq('id', id);
  if (error) return { erro: traduzirErro(error.message) };

  revalidatePath('/recorrentes');
  revalidatePath('/');
  return { ok: true };
}
