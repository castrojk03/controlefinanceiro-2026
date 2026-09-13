'use client';

import Link from 'next/link';
import type { ClassificacaoArea } from '@/types/financeiro';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Sem símbolo e sem centavos: 13 colunas de "R$ 1.234,56" viram ruído. */
const numero = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export interface LinhaDaGrade {
  id: string;
  nome: string;
  classificacao: ClassificacaoArea | null;
  meses: number[];
}

interface Props {
  ano: number;
  receitas: number[];
  linhas: LinhaDaGrade[];
  despesas: number[];
  saldo: number[];
  /** Índice do mês corrente, quando a grade é do ano em curso. */
  mesCorrente: number | null;
  erro: string | null;
}

export function PainelGeral({
  ano,
  receitas,
  linhas,
  despesas,
  saldo,
  mesCorrente,
  erro,
}: Props) {
  const somaAno = (m: number[]) => m.reduce((s, v) => s + v, 0);

  /** Uma célula vazia é traço, não zero: zero afirma, traço não. */
  const celula = (v: number) => (v === 0 ? '—' : numero(v));

  if (erro) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        Não foi possível carregar o painel: {erro}
      </div>
    );
  }

  const temDado = receitas.some((v) => v > 0) || linhas.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel Geral</h1>
          <p className="text-sm text-muted-foreground">
            O ano inteiro de uma vez — onde o dinheiro entra e sai, mês a mês.
          </p>
        </div>

        <nav className="flex items-center gap-1" aria-label="Trocar de ano">
          <Link
            href={`/painel-geral?ano=${ano - 1}`}
            aria-label="Ano anterior"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[70px] text-center text-sm font-medium">{ano}</span>
          <Link
            href={`/painel-geral?ano=${ano + 1}`}
            aria-label="Próximo ano"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      {!temDado ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum lançamento em {ano}.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="sticky left-0 z-10 bg-card px-3 py-2.5 text-left font-medium">
                      Área
                    </th>
                    {MESES.map((m, i) => (
                      <th
                        key={m}
                        className={`px-2 py-2.5 text-right font-medium ${
                          i === mesCorrente ? 'text-foreground' : ''
                        }`}
                      >
                        {m}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right font-medium">Ano</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {/* Receitas em cima: é de onde tudo vem. */}
                  <tr className="bg-emerald-50/50 font-medium">
                    <td className="sticky left-0 z-10 bg-emerald-50/50 px-3 py-2">
                      Receitas
                    </td>
                    {receitas.map((v, i) => (
                      <td
                        key={i}
                        title={v > 0 ? `${MESES_LONGOS[i]} · ${moeda(v)}` : undefined}
                        className={`px-2 py-2 text-right tabular-nums ${
                          i === mesCorrente ? 'bg-muted/40' : ''
                        }`}
                      >
                        {celula(v)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right tabular-nums">
                      {celula(somaAno(receitas))}
                    </td>
                  </tr>

                  {linhas.map((linha) => (
                    <tr key={linha.id}>
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-3 py-2">
                        {linha.nome}
                      </td>
                      {linha.meses.map((v, i) => (
                        <td
                          key={i}
                          title={
                            v > 0
                              ? `${linha.nome} · ${MESES_LONGOS[i]} · ${moeda(v)}`
                              : undefined
                          }
                          className={`px-2 py-2 text-right tabular-nums ${
                            i === mesCorrente ? 'bg-muted/40' : ''
                          } ${v === 0 ? 'text-muted-foreground' : ''}`}
                        >
                          {celula(v)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {celula(somaAno(linha.meses))}
                      </td>
                    </tr>
                  ))}

                  <tr className="border-t-2 font-medium">
                    <td className="sticky left-0 z-10 bg-card px-3 py-2">
                      Total de saídas
                    </td>
                    {despesas.map((v, i) => (
                      <td
                        key={i}
                        className={`px-2 py-2 text-right tabular-nums ${
                          i === mesCorrente ? 'bg-muted/40' : ''
                        }`}
                      >
                        {celula(v)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right tabular-nums">
                      {celula(somaAno(despesas))}
                    </td>
                  </tr>

                  {/* Saldo embaixo: é o que sobra depois de tudo. */}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2.5">
                      Saldo
                    </td>
                    {saldo.map((v, i) => {
                      const vazio = receitas[i] === 0 && despesas[i] === 0;
                      return (
                        <td
                          key={i}
                          className={`px-2 py-2.5 text-right tabular-nums ${
                            vazio
                              ? 'text-muted-foreground'
                              : v < 0
                                ? 'text-destructive'
                                : 'text-emerald-700'
                          }`}
                        >
                          {vazio ? '—' : numero(v)}
                        </td>
                      );
                    })}
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        somaAno(saldo) < 0 ? 'text-destructive' : 'text-emerald-700'
                      }`}
                    >
                      {numero(somaAno(saldo))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Valores arredondados para caber na grade — passe o mouse numa célula
        para ver o valor exato. Os meses à frente já vêm preenchidos porque as
        contas recorrentes foram geradas 24 meses adiante; os meses anteriores a
        setembro de 2026 estão vazios porque a gestão começou ali.
      </p>
    </div>
  );
}
