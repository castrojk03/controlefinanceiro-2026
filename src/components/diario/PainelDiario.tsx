'use client';

import Link from 'next/link';
import type { Lancamento } from '@/types/financeiro';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/** Sem o símbolo, para a tabela não ficar com "R$" repetido 31 vezes. */
const numero = (v: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export interface DiaDoMes {
  data: string;
  diaDaSemana: number;
  entrada: number;
  saida: number;
  /** Nulo nos dias anteriores a hoje: não foi medido, não se inventa. */
  saldo: number | null;
  ehHoje: boolean;
  lancamentos: Lancamento[];
}

interface Props {
  dias: DiaDoMes[];
  mes: number;
  ano: number;
  entrouNoMes: number;
  saiuNoMes: number;
  saldoHoje: number;
  hoje: string;
  erro: string | null;
}

export function PainelDiario({
  dias,
  mes,
  ano,
  entrouNoMes,
  saiuNoMes,
  saldoHoje,
  hoje,
  erro,
}: Props) {
  const anterior = mes === 1 ? { mes: 12, ano: ano - 1 } : { mes: mes - 1, ano };
  const seguinte = mes === 12 ? { mes: 1, ano: ano + 1 } : { mes: mes + 1, ano };

  // O primeiro dia em que o saldo fica negativo — o aperto antes de
  // acontecer, que é a razão de a tela existir.
  const aperto = dias.find((d) => d.saldo !== null && d.saldo < 0);

  const dataCurta = (iso: string) => iso.slice(8, 10);

  if (erro) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        Não foi possível carregar o painel: {erro}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel Diário</h1>
          <p className="text-sm text-muted-foreground">
            Como está hoje e o que vem pela frente, dia a dia.
          </p>
        </div>

        <nav className="flex items-center gap-1" aria-label="Trocar de mês">
          <Link
            href={`/painel-diario?mes=${anterior.mes}&ano=${anterior.ano}`}
            aria-label="Mês anterior"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {MESES[mes - 1]} {ano}
          </span>
          <Link
            href={`/painel-diario?mes=${seguinte.mes}&ano=${seguinte.ano}`}
            aria-label="Próximo mês"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm">Entrou no mês</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{moeda(entrouNoMes)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <ArrowDown className="h-4 w-4" />
              <span className="text-sm">Saiu no mês</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{moeda(saiuNoMes)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="mb-2 text-sm text-muted-foreground">
              Saldo em {dataCurta(hoje)}/{String(mes).padStart(2, '0')}
            </p>
            <p
              className={`text-xl font-semibold tabular-nums ${
                saldoHoje < 0 ? 'text-destructive' : ''
              }`}
            >
              {moeda(saldoHoje)}
            </p>
          </CardContent>
        </Card>
      </div>

      {aperto && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          O saldo fica negativo em{' '}
          <strong>
            {dataCurta(aperto.data)}/{String(mes).padStart(2, '0')}
          </strong>{' '}
          — {moeda(aperto.saldo ?? 0)}.
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 text-left font-medium">Dia</th>
                  <th className="px-3 py-2.5 text-right font-medium">Entrada</th>
                  <th className="px-3 py-2.5 text-right font-medium">Saída</th>
                  <th className="px-3 py-2.5 text-right font-medium">Do dia</th>
                  <th className="px-3 py-2.5 text-right font-medium">Saldo</th>
                  <th className="px-3 py-2.5 text-left font-medium">Lançamentos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dias.map((d) => {
                  const liquido = d.entrada - d.saida;
                  const vazio = d.entrada === 0 && d.saida === 0;

                  return (
                    <tr
                      key={d.data}
                      className={
                        d.ehHoje
                          ? 'bg-muted/60 font-medium'
                          : vazio
                            ? 'text-muted-foreground'
                            : ''
                      }
                    >
                      <td className="whitespace-nowrap px-3 py-2">
                        {dataCurta(d.data)}{' '}
                        <span className="text-xs text-muted-foreground">
                          {SEMANA[d.diaDaSemana]}
                        </span>
                        {d.ehHoje && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            · hoje
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-right tabular-nums">
                        {d.entrada > 0 ? numero(d.entrada) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {d.saida > 0 ? numero(d.saida) : '—'}
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums ${
                          liquido < 0 ? 'text-destructive' : liquido > 0 ? 'text-emerald-700' : ''
                        }`}
                      >
                        {vazio ? '—' : `${liquido > 0 ? '+' : ''}${numero(liquido)}`}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-medium tabular-nums ${
                          d.saldo !== null && d.saldo < 0 ? 'text-destructive' : ''
                        }`}
                      >
                        {d.saldo === null ? '—' : numero(d.saldo)}
                      </td>

                      <td className="max-w-[260px] truncate px-3 py-2 text-muted-foreground">
                        {d.lancamentos.length === 0
                          ? '—'
                          : d.lancamentos.map((l) => l.descricao).join(' · ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        O saldo corre a partir de hoje, com o que as contas de fato têm. Os dias
        já passados mostram o movimento, mas não o saldo: a gestão começou em
        13/09/2026 e reconstruir o que veio antes seria inventar precisão.
      </p>
    </div>
  );
}
