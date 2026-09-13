'use client';

import Link from 'next/link';
import type { Lancamento } from '@/types/financeiro';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  CreditCard,
} from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/** Sem o símbolo: "R$" repetido 31 vezes vira ruído na tabela. */
const numero = (v: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** A fatura de um cartão caindo no dia do vencimento. */
export interface FaturaDoDia {
  cartao: string;
  valor: number;
  /** Fechada é valor firme; aberta ainda pode crescer até o fechamento. */
  fechada: boolean;
}

export interface DiaDoMes {
  data: string;
  diaDaSemana: number;
  entrada: number;
  /** Tudo que foi gasto no dia — conta e cartão. */
  gastoDoDia: number;
  /** Só o que tocou o dinheiro, mais a fatura que vence hoje. */
  saiuDaConta: number;
  /** Nulo nos dias anteriores a hoje: não foi medido, não se inventa. */
  saldo: number | null;
  ehHoje: boolean;
  lancamentos: Lancamento[];
  faturas: FaturaDoDia[];
}

interface Props {
  dias: DiaDoMes[];
  mes: number;
  ano: number;
  entrouNoMes: number;
  gastoNoMes: number;
  saldoHoje: number;
  hoje: string;
  erro: string | null;
}

export function PainelDiario({
  dias,
  mes,
  ano,
  entrouNoMes,
  gastoNoMes,
  saldoHoje,
  hoje,
  erro,
}: Props) {
  const anterior = mes === 1 ? { mes: 12, ano: ano - 1 } : { mes: mes - 1, ano };
  const seguinte = mes === 12 ? { mes: 1, ano: ano + 1 } : { mes: mes + 1, ano };

  // O primeiro dia em que o saldo fica negativo: o aperto antes de
  // acontecer, que é a razão de a tela existir.
  const aperto = dias.find((d) => d.saldo !== null && d.saldo < 0);

  const dia = (iso: string) => iso.slice(8, 10);
  const mm = String(mes).padStart(2, '0');

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
            Quanto você gasta por dia e o que ainda vai sair da conta.
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
              <span className="text-sm">Gasto no mês</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{moeda(gastoNoMes)}</p>
            <p className="mt-1 text-xs text-muted-foreground">conta e cartão</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="mb-2 text-sm text-muted-foreground">
              Saldo em {dia(hoje)}/{hoje.slice(5, 7)}
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
            {dia(aperto.data)}/{mm}
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
                  <th className="px-3 py-2.5 text-right font-medium">Gasto do dia</th>
                  <th className="px-3 py-2.5 text-right font-medium">Saiu da conta</th>
                  <th className="px-3 py-2.5 text-right font-medium">Saldo</th>
                  <th className="px-3 py-2.5 text-left font-medium">O quê</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dias.map((d) => {
                  const vazio =
                    d.entrada === 0 && d.gastoDoDia === 0 && d.faturas.length === 0;

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
                        {dia(d.data)}{' '}
                        <span className="text-xs text-muted-foreground">
                          {SEMANA[d.diaDaSemana]}
                        </span>
                        {d.ehHoje && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            · hoje
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                        {d.entrada > 0 ? numero(d.entrada) : '—'}
                      </td>

                      <td className="px-3 py-2 text-right tabular-nums">
                        {d.gastoDoDia > 0 ? numero(d.gastoDoDia) : '—'}
                      </td>

                      <td className="px-3 py-2 text-right tabular-nums">
                        {d.saiuDaConta > 0 ? numero(d.saiuDaConta) : '—'}
                      </td>

                      <td
                        className={`px-3 py-2 text-right font-medium tabular-nums ${
                          d.saldo !== null && d.saldo < 0 ? 'text-destructive' : ''
                        }`}
                      >
                        {d.saldo === null ? '—' : numero(d.saldo)}
                      </td>

                      <td className="min-w-[240px] px-3 py-2 text-muted-foreground">
                        {d.faturas.map((f) => (
                          <span
                            key={f.cartao}
                            className="mr-2 inline-flex items-center gap-1 whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700"
                          >
                            <CreditCard className="h-3 w-3" />
                            fatura {f.cartao}
                            {!f.fechada && ' · aberta'}
                          </span>
                        ))}
                        {d.lancamentos.length === 0 && d.faturas.length === 0 && '—'}

                        {/* Cada lançamento é seu próprio elemento para o
                            valor caber no title: a lista mostra onde o
                            dinheiro foi, o hover mostra quanto. */}
                        {d.lancamentos.map((l, i) => (
                          <span key={l.id}>
                            {i > 0 && <span className="opacity-40"> · </span>}
                            <span
                              title={`${l.descricao} · ${moeda(Number(l.valor))}`}
                              className="cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-2"
                            >
                              {l.descricao}
                            </span>
                          </span>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <p>
          <strong className="font-medium text-foreground">Gasto do dia</strong> é
          tudo que você gastou naquele dia, na conta ou no cartão — o almoço de
          R$ 27 no crédito conta aqui, no dia em que aconteceu.{' '}
          <strong className="font-medium text-foreground">Saiu da conta</strong> é
          só o que tocou o dinheiro, e a fatura entra como uma linha só, no
          vencimento. O saldo corre sobre essa segunda coluna.
        </p>
        <p>
          As faturas ainda abertas aparecem pelo que já foi gasto até agora e
          vão crescer até o fechamento do cartão.
        </p>
      </div>
    </div>
  );
}
