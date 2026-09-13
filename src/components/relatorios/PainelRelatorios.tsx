'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const numero = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_CURTOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

export interface Balde {
  chave: string;
  rotulo: string;
  valor: number;
  /** A meta do método: 50, 35 ou 15. */
  meta: number;
  /** Quanto da receita do mês este balde consumiu. */
  percentual: number;
}

export interface MesDoAno {
  mes: number;
  receita: number;
  despesa: number;
  economia: number;
  /** Nulo quando não houve receita: não há taxa sobre nada. */
  taxa: number | null;
}

interface Props {
  ano: number;
  mes: number;
  baldes: Balde[];
  receitaDoMes: number;
  despesaDoMes: number;
  semClassificacao: number;
  meses: MesDoAno[];
  erro: string | null;
}

export function PainelRelatorios({
  ano,
  mes,
  baldes,
  receitaDoMes,
  despesaDoMes,
  semClassificacao,
  meses,
  erro,
}: Props) {
  const anterior = mes === 1 ? { mes: 12, ano: ano - 1 } : { mes: mes - 1, ano };
  const seguinte = mes === 12 ? { mes: 1, ano: ano + 1 } : { mes: mes + 1, ano };

  const economiaDoMes = receitaDoMes - despesaDoMes;
  const taxaDoMes =
    receitaDoMes > 0
      ? Math.round((economiaDoMes / receitaDoMes) * 1000) / 10
      : null;

  const comMovimento = meses.filter((m) => m.receita > 0 || m.despesa > 0);
  const receitaAno = meses.reduce((s, m) => s + m.receita, 0);
  const economiaAno = meses.reduce((s, m) => s + m.economia, 0);
  const taxaAno =
    receitaAno > 0 ? Math.round((economiaAno / receitaAno) * 1000) / 10 : null;

  if (erro) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        Não foi possível carregar os relatórios: {erro}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Para onde seu dinheiro foi, e quanto dele ficou.
          </p>
        </div>

        <nav className="flex items-center gap-1" aria-label="Trocar de mês">
          <Link
            href={`/relatorios?mes=${anterior.mes}&ano=${anterior.ano}`}
            aria-label="Mês anterior"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {MESES[mes - 1]} {ano}
          </span>
          <Link
            href={`/relatorios?mes=${seguinte.mes}&ano=${seguinte.ano}`}
            aria-label="Próximo mês"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------- proporção 50-35-15 ---------------- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Proporção 50-35-15</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sobre a receita de {MESES[mes - 1].toLowerCase()}:{' '}
              {moeda(receitaDoMes)}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {receitaDoMes === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sem receita lançada neste mês — a proporção precisa de uma base
                para ser calculada.
              </p>
            ) : (
              <>
                {baldes.map((b) => {
                  const acima = b.percentual > b.meta;
                  return (
                    <div key={b.chave} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span>
                          {b.rotulo}{' '}
                          <span className="text-xs text-muted-foreground">
                            meta {b.meta}%
                          </span>
                        </span>
                        <span className="tabular-nums">
                          <strong className={acima ? 'text-amber-700' : ''}>
                            {b.percentual}%
                          </strong>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {moeda(b.valor)}
                          </span>
                        </span>
                      </div>

                      {/* A barra vai até a meta em escala: assim 54% num
                          balde de meta 50 transborda visivelmente, e 28%
                          num de meta 35 aparece curto. */}
                      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            acima ? 'bg-amber-500' : 'bg-foreground/70'
                          }`}
                          style={{
                            width: `${Math.min(100, (b.percentual / b.meta) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Sobrou no mês
                    </span>
                    <span
                      className={`tabular-nums ${
                        economiaDoMes < 0 ? 'text-destructive' : 'text-emerald-700'
                      }`}
                    >
                      {moeda(economiaDoMes)}
                      {taxaDoMes !== null && (
                        <span className="ml-2 text-xs">({taxaDoMes}%)</span>
                      )}
                    </span>
                  </div>
                </div>

                {semClassificacao > 0 && (
                  <p className="flex items-start gap-1.5 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {moeda(semClassificacao)} em áreas fora do método (como
                    Ajustes) não entram na proporção.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ---------------- taxa de economia ---------------- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Taxa de economia · {ano}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Que fração da renda ficou retida — a métrica do ano no Termômetro.
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {comMovimento.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                Nenhum lançamento em {ano}.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Mês</th>
                    <th className="px-3 py-2 text-right font-medium">Entradas</th>
                    <th className="px-3 py-2 text-right font-medium">Economia</th>
                    <th className="px-4 py-2 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comMovimento.map((m) => (
                    <tr
                      key={m.mes}
                      className={m.mes === mes ? 'bg-muted/50 font-medium' : ''}
                    >
                      <td className="px-4 py-2">{MESES_CURTOS[m.mes - 1]}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {numero(m.receita)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums ${
                          m.economia < 0 ? 'text-destructive' : ''
                        }`}
                      >
                        {numero(m.economia)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {m.taxa === null ? '—' : `${m.taxa}%`}
                      </td>
                    </tr>
                  ))}

                  <tr className="border-t-2 bg-muted/30 font-semibold">
                    <td className="px-4 py-2.5">ano</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {numero(receitaAno)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        economiaAno < 0 ? 'text-destructive' : ''
                      }`}
                    >
                      {numero(economiaAno)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {taxaAno === null ? '—' : `${taxaAno}%`}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        A proporção é calculada sobre a receita do mês, não sobre o total
        gasto: as metas somam 100%, e o que falta para fechar é justamente o
        que sobrou. Meses desbalanceados são informação, não erro — um mês com
        IPVA ou uma compra grande desloca a proporção, e é isso que a tela
        existe para mostrar.
      </p>
    </div>
  );
}
