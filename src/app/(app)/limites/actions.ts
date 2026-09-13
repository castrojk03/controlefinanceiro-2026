'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { paraNumero } from '@/lib/valor';

type Resultado = { erro: string } | { ok: true };

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('limite_periodo_unico')) {
    return 'Já existe um teto de período para essa área começando nesse mês.';
  }
  if (mensagem.includes('limite_permanente_unico')) {
    return 'Essa área já tem um limite permanente. Edite o que existe.';
  }
  if (mensagem.includes('limite_mensal_unico')) {
    return 'Essa área já tem uma exceção para esse mês.';
  }
  if (mensagem.includes('limite_coerente')) {
    return 'Combinação de período inválida.';
  }
  if (mensagem.includes('row-level security')) {
    return 'Sem permissão para essa operação.';
  }
  return mensagem;
}

/** Último dia do mês, para o fim do período cobrir o mês inteiro. */
function fimDoMes(ano: number, mes: number): string {
  const d = new Date(ano, mes, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Cria ou atualiza um limite.
 *
 * Três formas, e a escolha do tipo decide quais campos valem:
 *
 *   permanente — vale todo mês, para sempre
 *   mensal     — sobrepõe o permanente só naquele mês
 *   periodo    — um teto único somando vários meses, que acumula
 *
 * Enviar só os campos do tipo escolhido não é detalhe: o CHECK do banco
 * recusa a mistura, e foi assim que o formulário de recorrências quebrou
 * quando mandava todos os campos de uma vez.
 */
export async function salvarLimite(formData: FormData): Promise<Resultado> {
  const id = String(formData.get('id') ?? '');
  const tipo = String(formData.get('tipo') ?? 'permanente');
  const areaId = String(formData.get('area_id') ?? '');
  const categoriaId = String(formData.get('categoria_id') ?? '');
  const valor = paraNumero(formData.get('valor'));

  if (!areaId) return { erro: 'Escolha a área.' };
  if (valor <= 0) return { erro: 'O limite precisa ser maior que zero.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sessão expirada. Entre novamente.' };

  const base: Record<string, unknown> = {
    user_id: user.id,
    area_id: areaId,
    categoria_id: categoriaId || null,
    valor,
    mes: null,
    ano: null,
    inicio: null,
    fim: null,
  };

  if (tipo === 'mensal') {
    const mes = Number(formData.get('mes'));
    const ano = Number(formData.get('ano'));
    if (!mes || !ano) return { erro: 'Informe o mês da exceção.' };
    base.mes = mes;
    base.ano = ano;
  }

  if (tipo === 'periodo') {
    const de = String(formData.get('inicio') ?? '');
    const ate = String(formData.get('fim') ?? '');
    if (!de || !ate) return { erro: 'Informe o mês inicial e o final.' };

    const [anoDe, mesDe] = de.split('-').map(Number);
    const [anoAte, mesAte] = ate.split('-').map(Number);

    if (anoAte < anoDe || (anoAte === anoDe && mesAte < mesDe)) {
      return { erro: 'O mês final não pode ser antes do inicial.' };
    }

    base.inicio = `${de}-01`;
    base.fim = fimDoMes(anoAte, mesAte);
  }

  const { error } = id
    ? await supabase.from('limites').update(base).eq('id', id)
    : await supabase.from('limites').insert(base);

  if (error) {
    console.error('[limites] falha ao salvar:', error);
    return { erro: traduzirErro(error.message) };
  }

  revalidatePath('/limites');
  return { ok: true };
}

export async function excluirLimite(id: string): Promise<Resultado> {
  if (!id) return { erro: 'Limite não identificado.' };

  const supabase = await createClient();
  const { error } = await supabase.from('limites').delete().eq('id', id);

  if (error) {
    console.error('[limites] falha ao excluir:', error);
    return { erro: traduzirErro(error.message) };
  }

  revalidatePath('/limites');
  return { ok: true };
}
