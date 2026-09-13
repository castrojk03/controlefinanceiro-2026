import { createClient } from '@/lib/supabase/server';
import { PainelFaturas, type FaturaNaTela } from '@/components/faturas/PainelFaturas';
import { cicloDoMes, situacaoDoCiclo } from '@/lib/fatura';
import type { Conta, Cartao, Lancamento } from '@/types/financeiro';

/** Quantos ciclos mostrar a partir do mês corrente. */
const CICLOS_A_MOSTRAR = 4;

/**
 * Faturas — o ciclo do cartão.
 *
 * As faturas nascem e fecham sozinhas: a tela calcula os ciclos a partir dos
 * dias configurados no cartão e monta cada um com os lançamentos do período.
 * Só o que já tem registro no banco (pagamento, ajuste) vem de lá.
 *
 * A gestão começa em setembro/2026 — ciclos anteriores não são exibidos.
 */
const PRIMEIRO_MES = 9;
const PRIMEIRO_ANO = 2026;

export default async function PaginaFaturas() {
  const supabase = await createClient();

  const [cartoesRes, contasRes] = await Promise.all([
    supabase.from('cards').select('*').eq('type', 'Crédito').order('name'),
    supabase.from('accounts').select('*').order('name'),
  ]);

  const cartoes = (cartoesRes.data ?? []) as Cartao[];
  const contas = (contasRes.data ?? []) as Conta[];

  const hoje = new Date();
  const faturas: FaturaNaTela[] = [];

  for (const cartao of cartoes) {
    if (!cartao.closing_day || !cartao.due_day) continue;

    for (let i = 0; i < CICLOS_A_MOSTRAR; i++) {
      const ref = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      const mes = ref.getMonth() + 1;
      const ano = ref.getFullYear();

      // Nada antes do início da gestão
      if (ano < PRIMEIRO_ANO || (ano === PRIMEIRO_ANO && mes < PRIMEIRO_MES)) {
        continue;
      }

      const ciclo = cicloDoMes(mes, ano, cartao.closing_day, cartao.due_day);

      const [lancRes, faturaRes] = await Promise.all([
        supabase
          .from('lancamentos')
          .select('*')
          .eq('cartao_id', cartao.id)
          .gte('data', ciclo.inicio)
          .lte('data', ciclo.fim)
          .order('data'),
        supabase
          .from('faturas')
          .select('*')
          .eq('cartao_id', cartao.id)
          .eq('mes', mes)
          .eq('ano', ano)
          .maybeSingle(),
      ]);

      const lancamentos = (lancRes.data ?? []) as Lancamento[];
      const registro = faturaRes.data;
      const somado = lancamentos.reduce((s, l) => s + Number(l.valor), 0);

      faturas.push({
        cartao,
        ciclo,
        situacao: situacaoDoCiclo(ciclo, hoje),
        lancamentos,
        somado,
        registro: registro ?? null,
      });
    }
  }

  return (
    <PainelFaturas
      faturas={faturas}
      contas={contas}
      temCartao={cartoes.length > 0}
      erro={cartoesRes.error?.message ?? null}
    />
  );
}
