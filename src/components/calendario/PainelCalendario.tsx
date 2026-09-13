'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Lancamento } from '@/types/financeiro';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CreditCard, Check } from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/** Sem centavos: a célula do calendário é pequena e o centavo não decide nada. */
const curto = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export interface VencimentoDoDia {
  descricao: string;
  valor: number;
  pago: boolean;
  ehFatura: boolean;
}

export interface DiaDoCalendario {
  data: string;
  dia: number;
  diaDaSemana: number;
  entrada: number;
  /** Conta e cartão somados: o que foi gasto naquele dia. */
  gasto: number;
  /** O que sai da conta naquele dia, faturas incluídas. */
  vencimentos: VencimentoDoDia[];
  ehHoje: boolean;
  lancamentos: Lancamento[];
}

interface Props {
  dias: DiaDoCalendario[];
  mes: number;
  ano: number;
  diaAberto: number | null;
  erro: string | null;
}

export function PainelCalendario({ dias, mes, ano, diaAberto, erro }: Props) {
  const router = useRouter();

  const anterior = mes === 1 ? { mes: 12, ano: ano - 1 } : { mes: mes - 1, ano };
  const seguinte = mes === 12 ? { mes: 1, ano: ano + 1 } : { mes: mes + 1, ano };

  // Quantas células vazias antes do dia 1, para a grade alinhar no dia da
  // semana certo.
  const vazias = dias.length > 0 ? dias[0].diaDaSemana : 0;

  const selecionado = dias.find((d) => d.dia === diaAberto) ?? null;

  function abrir(dia: number) {
    const url =
      dia === diaAberto
        ? `/calendario?mes=${mes}&ano=${ano}`
        : `/calendario?mes=${mes}&ano=${ano}&dia=${dia}`;
    router.push(url, { scroll: false });
  }

  if (erro) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        Não foi possível carregar o calendário: {erro}
      </div>
    );
  }

  const totalGasto = dias.reduce((s, d) => s + d.gasto, 0);
  const totalEntrada = dias.reduce((s, d) => s + d.entrada, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground">
            Onde gastou, quanto, e o que ainda vence.
          </p>
        </div>

        <nav className="flex items-center gap-1" aria-label="Trocar de mês">
          <Link
            href={`/calendario?mes=${anterior.mes}&ano=${anterior.ano}`}
            aria-label="Mês anterior"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {MESES[mes - 1]} {ano}
          </span>
          <Link
            href={`/calendario?mes=${seguinte.mes}&ano=${seguinte.ano}`}
            aria-label="Próximo mês"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>
          Entrou <strong className="text-emerald-700">{moeda(totalEntrada)}</strong>
        </span>
        <span>
          Gasto no mês <strong className="text-foreground">{moeda(totalGasto)}</strong>
        </span>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {SEMANA.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: vazias }).map((_, i) => (
              <div key={`vazia-${i}`} />
            ))}

            {dias.map((d) => {
              const temVencimento = d.vencimentos.length > 0;
              const tudoPago =
                temVencimento && d.vencimentos.every((v) => v.pago);
              const aberto = d.dia === diaAberto;

              return (
                <button
                  key={d.data}
                  type="button"
                  onClick={() => abrir(d.dia)}
                  aria-pressed={aberto}
                  title={
                    d.gasto > 0 || d.entrada > 0
                      ? `${d.dia}/${String(mes).padStart(2, '0')} · gasto ${moeda(d.gasto)}`
                      : undefined
                  }
                  className={[
                    'flex min-h-[68px] flex-col items-start rounded-md p-1.5 text-left transition-colors',
                    // Borda marca vencimento. Paga fica discreta: já resolveu.
                    temVencimento
                      ? tudoPago
                        ? 'border border-dashed border-muted-foreground/40'
                        : 'border-2 border-amber-400'
                      : 'border border-transparent',
                    // Preenchimento marca movimento no dia.
                    d.gasto > 0 || d.entrada > 0 ? 'bg-muted/60' : 'bg-transparent',
                    aberto ? 'ring-2 ring-foreground/60' : '',
                    'hover:bg-muted',
                  ].join(' ')}
                >
                  <span
                    className={`text-xs ${
                      d.ehHoje
                        ? 'flex h-5 w-5 items-center justify-center rounded-full bg-foreground font-semibold text-background'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {d.dia}
                  </span>

                  <span className="mt-auto w-full space-y-0.5">
                    {d.entrada > 0 && (
                      <span className="block truncate text-[11px] font-medium tabular-nums text-emerald-700">
                        +{curto(d.entrada)}
                      </span>
                    )}
                    {d.gasto > 0 && (
                      <span className="block truncate text-[11px] tabular-nums">
                        −{curto(d.gasto)}
                      </span>
                    )}
                    {temVencimento && (
                      <span className="flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
                        {d.vencimentos[0].ehFatura && (
                          <CreditCard className="h-2.5 w-2.5 shrink-0" />
                        )}
                        {tudoPago && <Check className="h-2.5 w-2.5 shrink-0" />}
                        {d.vencimentos.length === 1
                          ? d.vencimentos[0].descricao
                          : `${d.vencimentos.length} contas`}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-muted/60" />
          houve movimento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-amber-400" />
          tem conta vencendo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-dashed border-muted-foreground/40" />
          vencimento já pago
        </span>
      </div>

      {selecionado && (
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 text-sm font-medium">
              Dia {selecionado.dia} de {MESES[mes - 1].toLowerCase()}
              {selecionado.ehHoje && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  · hoje
                </span>
              )}
            </p>

            {selecionado.lancamentos.length === 0 &&
            selecionado.vencimentos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nada neste dia.
              </p>
            ) : (
              <ul className="divide-y">
                {selecionado.lancamentos.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="truncate">{l.descricao}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {l.status === 'pago' ? 'pago' : 'previsto'}
                        {l.cartao_id && ' · cartão'}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 tabular-nums ${
                        l.tipo === 'entrada' ? 'text-emerald-700' : ''
                      }`}
                    >
                      {l.tipo === 'entrada' ? '+' : '−'}
                      {moeda(Number(l.valor))}
                    </span>
                  </li>
                ))}

                {/* As faturas não são lançamentos: aparecem como o
                    compromisso que de fato são. */}
                {selecionado.vencimentos
                  .filter((v) => v.ehFatura)
                  .map((v) => (
                    <li
                      key={v.descricao}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{v.descricao}</span>
                        <span className="text-xs text-muted-foreground">
                          {v.pago ? 'paga' : 'vence hoje'}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        −{moeda(v.valor)}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        O valor na célula é o gasto daquele dia, conta e cartão somados — a
        compra no crédito conta no dia em que aconteceu. A borda marca o dia em
        que alguma conta sai do bolso, incluindo a fatura do cartão, que vence
        bem depois das compras que a formaram.
      </p>
    </div>
  );
}
