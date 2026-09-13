'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { pagarFatura, ajustarFatura } from '@/app/(app)/faturas/actions';
import { periodoLegivel, type CicloFatura } from '@/lib/fatura';
import type { Conta, Cartao, Lancamento } from '@/types/financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Receipt,
  Lock,
  ChevronDown,
  ChevronRight,
  Pencil,
  CircleAlert,
} from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const dataBR = (iso: string) => iso.split('-').reverse().join('/');

const hojeISO = () => new Date().toISOString().slice(0, 10);

const campoSelect =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** O que a página monta para cada ciclo do cartão. */
export interface FaturaNaTela {
  cartao: Cartao;
  ciclo: CicloFatura;
  situacao: 'aberta' | 'fechada' | 'vencida';
  lancamentos: Lancamento[];
  /** Soma dos lançamentos do período, recalculada a cada carregamento. */
  somado: number;
  /** O registro no banco, quando já existe (pagamento, ajuste). */
  registro: {
    id: string;
    status: string;
    total: number;
    total_ajustado: number | null;
    saldo_anterior: number;
    valor_pago: number;
    data_pagamento: string | null;
    editada_em: string | null;
  } | null;
}

interface Props {
  faturas: FaturaNaTela[];
  contas: Conta[];
  temCartao: boolean;
  erro: string | null;
}

/**
 * O selo de situação. Fatura paga vence qualquer outro estado: mesmo
 * depois do vencimento, uma fatura quitada não está "vencida".
 */
function selo(f: FaturaNaTela) {
  const status = f.registro?.status;

  if (status === 'paga') {
    return { texto: 'Paga', classe: 'bg-emerald-100 text-emerald-800' };
  }
  if (status === 'parcial') {
    return { texto: 'Paga em parte', classe: 'bg-amber-100 text-amber-900' };
  }
  if (f.situacao === 'vencida') {
    return { texto: 'Vencida', classe: 'bg-red-100 text-red-800' };
  }
  if (f.situacao === 'fechada') {
    return { texto: 'Fechada', classe: 'bg-slate-200 text-slate-800' };
  }
  return { texto: 'Aberta', classe: 'bg-blue-100 text-blue-800' };
}

/** O quanto ainda se deve: o ajuste manda sobre a soma, quando existe. */
function devido(f: FaturaNaTela): number {
  const base = f.registro?.total_ajustado ?? (f.registro?.total || f.somado);
  const anterior = f.registro?.saldo_anterior ?? 0;
  const pago = f.registro?.status === 'parcial' ? f.registro.valor_pago : 0;
  return Math.round((Number(base) + Number(anterior) - pago) * 100) / 100;
}

export function PainelFaturas({ faturas, contas, temCartao, erro }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  const [aberta, setAberta] = useState<string | null>(null);
  const [pagando, setPagando] = useState<FaturaNaTela | null>(null);
  const [ajustando, setAjustando] = useState<FaturaNaTela | null>(null);

  const chave = (f: FaturaNaTela) => `${f.cartao.id}-${f.ciclo.mes}-${f.ciclo.ano}`;

  function enviarPagamento(dados: FormData) {
    iniciar(async () => {
      const r = await pagarFatura(dados);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Pagamento registrado.');
      setPagando(null);
      router.refresh();
    });
  }

  function enviarAjuste(dados: FormData) {
    iniciar(async () => {
      const r = await ajustarFatura(dados);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Fatura ajustada.');
      setAjustando(null);
      router.refresh();
    });
  }

  if (erro) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        Não foi possível carregar as faturas: {erro}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Faturas</h1>
        <p className="text-sm text-muted-foreground">
          As faturas abrem e fecham sozinhas, pelo dia de fechamento do cartão.
          O que você faz aqui é registrar o pagamento.
        </p>
      </header>

      {!temCartao && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum cartão de crédito cadastrado. Cadastre em Configurações para
            as faturas começarem a ser montadas.
          </CardContent>
        </Card>
      )}

      {temCartao && faturas.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum ciclo a mostrar. Confira se o cartão tem dia de fechamento e
            de vencimento preenchidos.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {faturas.map((f) => {
          const id = chave(f);
          const expandida = aberta === id;
          const s = selo(f);
          const aPagar = devido(f);
          const quitada = f.registro?.status === 'paga';
          const podeAjustar =
            f.situacao !== 'aberta' || f.registro?.status === 'paga';

          return (
            <Card key={id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      {f.cartao.name}
                      <span className="font-normal text-muted-foreground">
                        · {MESES[f.ciclo.mes - 1]}
                      </span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Compras de {periodoLegivel(f.ciclo)} · vence{' '}
                      {dataBR(f.ciclo.vencimento)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.classe}`}
                  >
                    {s.texto}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {quitada ? 'Valor pago' : 'A pagar'}
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {moeda(quitada ? Number(f.registro?.valor_pago) : aPagar)}
                    </p>

                    {f.registro && Number(f.registro.saldo_anterior) > 0 && (
                      <p className="text-xs text-amber-700">
                        Inclui {moeda(Number(f.registro.saldo_anterior))} da
                        fatura anterior
                      </p>
                    )}

                    {f.registro?.total_ajustado != null && (
                      <p className="text-xs text-muted-foreground">
                        Somado {moeda(f.somado)} · ajustado para{' '}
                        {moeda(Number(f.registro.total_ajustado))}
                      </p>
                    )}

                    {f.registro?.editada_em && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3" />
                        Editada em{' '}
                        {new Date(f.registro.editada_em).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {podeAjustar && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAjustando(f)}
                      >
                        <Lock className="mr-1.5 h-3.5 w-3.5" />
                        Ajustar
                      </Button>
                    )}

                    {!quitada && (
                      <Button size="sm" onClick={() => setPagando(f)}>
                        Pagar
                      </Button>
                    )}
                  </div>
                </div>

                {f.situacao === 'aberta' && (
                  <p className="flex items-start gap-1.5 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Ainda aberta: novas compras até {dataBR(f.ciclo.fechamento)}{' '}
                    entram nesta fatura e o valor vai mudar.
                  </p>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => setAberta(expandida ? null : id)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {expandida ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {f.lancamentos.length === 0
                      ? 'Nenhuma compra no período'
                      : `${f.lancamentos.length} ${
                          f.lancamentos.length === 1 ? 'compra' : 'compras'
                        }`}
                  </button>

                  {expandida && f.lancamentos.length > 0 && (
                    <ul className="mt-3 divide-y rounded-md border">
                      {f.lancamentos.map((l) => (
                        <li
                          key={l.id}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate">{l.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              {dataBR(l.data)}
                              {l.parcela_total
                                ? ` · parcela ${l.parcela_numero}/${l.parcela_total}`
                                : ''}
                            </p>
                          </div>
                          <span className="shrink-0 tabular-nums">
                            {moeda(Number(l.valor))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Pagamento — integral ou parcial                             */}
      {/* ---------------------------------------------------------- */}
      <Dialog open={!!pagando} onOpenChange={(o) => !o && setPagando(null)}>
        <DialogContent>
          <form action={enviarPagamento}>
            <DialogHeader>
              <DialogTitle>Pagar fatura</DialogTitle>
              <DialogDescription>
                {pagando &&
                  `${pagando.cartao.name} · ${MESES[pagando.ciclo.mes - 1]} · vence ${dataBR(
                    pagando.ciclo.vencimento
                  )}`}
              </DialogDescription>
            </DialogHeader>

            <input type="hidden" name="id" value={pagando?.registro?.id ?? ''} />

            <div className="space-y-4 py-4">
              {pagando && !pagando.registro && (
                <p className="rounded-md bg-amber-50 p-2.5 text-xs text-amber-900">
                  Esta fatura ainda não foi criada no banco. Abra a tela de novo
                  para que ela seja registrada antes de pagar.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="valor">Valor pago</Label>
                <Input
                  id="valor"
                  name="valor"
                  defaultValue={pagando ? devido(pagando).toFixed(2) : ''}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Pagando menos que o total, o restante vira saldo da próxima
                  fatura. Os juros vêm no boleto do banco e você lança à parte.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta_id">Saiu de qual conta</Label>
                <select
                  id="conta_id"
                  name="conta_id"
                  required
                  className={campoSelect}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Escolha a conta
                  </option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_pagamento">Data do pagamento</Label>
                <Input
                  id="data_pagamento"
                  name="data_pagamento"
                  type="date"
                  defaultValue={hojeISO()}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPagando(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pendente || !pagando?.registro}>
                {pendente ? 'Registrando…' : 'Registrar pagamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------------- */}
      {/* Ajuste — exige a senha                                      */}
      {/* ---------------------------------------------------------- */}
      <Dialog open={!!ajustando} onOpenChange={(o) => !o && setAjustando(null)}>
        <DialogContent>
          <form action={enviarAjuste}>
            <DialogHeader>
              <DialogTitle>Ajustar valor da fatura</DialogTitle>
              <DialogDescription>
                Use quando o banco cobrar diferente do que o sistema somou —
                IOF, anuidade, juros. A diferença vira um lançamento próprio.
              </DialogDescription>
            </DialogHeader>

            <input
              type="hidden"
              name="id"
              value={ajustando?.registro?.id ?? ''}
            />

            <div className="space-y-4 py-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Somado pelo sistema</span>
                  <span className="tabular-nums">
                    {ajustando && moeda(ajustando.somado)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_ajustado">Valor que o banco cobrou</Label>
                <Input
                  id="total_ajustado"
                  name="total_ajustado"
                  defaultValue={ajustando ? ajustando.somado.toFixed(2) : ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Sua senha</Label>
                <Input id="senha" name="senha" type="password" required />
                <p className="text-xs text-muted-foreground">
                  Fatura fechada é registro do que aconteceu. A senha existe
                  para o valor não mudar por engano.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAjustando(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pendente || !ajustando?.registro}>
                {pendente ? 'Ajustando…' : 'Confirmar ajuste'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
