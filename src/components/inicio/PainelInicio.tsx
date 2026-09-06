'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { pagarLancamento } from '@/app/(app)/actions';
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
  Wallet,
  ArrowUp,
  ArrowDown,
  CreditCard,
  AlertTriangle,
  Bot,
  Zap,
  Pencil,
} from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/** "seg 08/09" — o dia da semana ajuda a situar o vencimento. */
function dataCurta(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  const semana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d.getDay()];
  return `${semana} ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

const campoSelect =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface Props {
  contas: Conta[];
  cartoes: Cartao[];
  saldoTotal: number;
  receitasMes: number;
  despesasMes: number;
  vencimentos: Lancamento[];
  atrasados: Lancamento[];
  ultimos: Lancamento[];
  janela: number;
  erro: string | null;
}

export function PainelInicio({
  contas,
  cartoes,
  saldoTotal,
  receitasMes,
  despesasMes,
  vencimentos,
  atrasados,
  ultimos,
  janela,
  erro,
}: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  const [pagando, setPagando] = useState<Lancamento | null>(null);
  const [valorPago, setValorPago] = useState('');
  const [dataPago, setDataPago] = useState(hojeISO);
  const [contaPago, setContaPago] = useState('');
  const [cartaoPago, setCartaoPago] = useState('');
  const [forma, setForma] = useState<'conta' | 'cartao'>('conta');

  function abrirPagamento(l: Lancamento) {
    setPagando(l);
    setValorPago(String(l.valor));
    setDataPago(hojeISO());
    // O cadastro da conta já diz se ela é de cartão; a janela abre no que
    // estiver registrado, e o John troca se for o caso.
    setForma(l.cartao_id ? 'cartao' : 'conta');
    setContaPago(l.conta_id ?? contas[0]?.id ?? '');
    setCartaoPago(l.cartao_id ?? cartoes[0]?.id ?? '');
  }

  function confirmarPagamento(formData: FormData) {
    iniciar(async () => {
      const r = await pagarLancamento(formData);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Pagamento registrado.');
      setPagando(null);
    });
  }

  const totalJanela = vencimentos.reduce((s, l) => s + Number(l.valor), 0);
  const totalAtrasado = atrasados.reduce((s, l) => s + Number(l.valor), 0);
  const cartaoCredito = cartoes.find((c) => c.type === 'Crédito');

  /** Ícone de origem: 🤖 agente · ⚡ manual · ✎ editado depois. */
  function Origem({ l }: { l: Lancamento }) {
    return (
      <span className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
        {l.origem === 'agente' ? (
          <Bot className="h-3.5 w-3.5" aria-label="registrado pelo agente" />
        ) : (
          <Zap className="h-3.5 w-3.5" aria-label="lançamento manual" />
        )}
        {l.editado_em && <Pencil className="h-3 w-3" aria-label="editado" />}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Início</h1>
        <p className="text-muted-foreground">
          Quanto você tem e o que vem pela frente.
        </p>
      </header>

      {erro && (
        <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Não foi possível carregar: {erro}
        </div>
      )}

      {/* ---------- os quatro números ---------- */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Saldo atual</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {moeda(saldoTotal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              em {contas.length} conta{contas.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm">Receitas do mês</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {moeda(receitasMes)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">previsto e realizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <ArrowDown className="h-4 w-4" />
              <span className="text-sm">Despesas do mês</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {moeda(despesasMes)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">previsto e realizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Cartão</span>
            </div>
            {cartaoCredito ? (
              <>
                <p className="text-2xl font-semibold tabular-nums">
                  {moeda(Number(cartaoCredito.credit_limit))}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  limite de {cartaoCredito.name} · fatura entra na tela de Faturas
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-muted-foreground">—</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  nenhum cartão de crédito
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------- atrasados ---------- */}
      {atrasados.length > 0 && (
        <Card className="mb-4 border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Venceu e não foi pago
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {atrasados.length} conta{atrasados.length === 1 ? '' : 's'} ·{' '}
              {moeda(totalAtrasado)}
            </p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {atrasados.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-2.5">
                  <Origem l={l} />
                  <span className="w-20 shrink-0 text-sm text-destructive">
                    {dataCurta(l.data)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{l.descricao}</span>
                  <span className="tabular-nums">{moeda(Number(l.valor))}</span>
                  <Button size="sm" variant="outline" onClick={() => abrirPagamento(l)}>
                    pagar
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ---------- próximos vencimentos ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Próximos {janela} dias</CardTitle>
              <p className="text-sm text-muted-foreground">
                {vencimentos.length} conta{vencimentos.length === 1 ? '' : 's'} ·{' '}
                <strong>{moeda(totalJanela)}</strong>
              </p>
            </div>
            <div className="flex gap-1">
              {[7, 15, 30].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={janela === d ? 'default' : 'outline'}
                  onClick={() => router.push(d === 7 ? '/' : `/?dias=${d}`)}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vencimentos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nada vence nos próximos {janela} dias.
            </p>
          ) : (
            <ul className="divide-y">
              {vencimentos.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-2.5">
                  <Origem l={l} />
                  <span className="w-20 shrink-0 text-sm text-muted-foreground">
                    {dataCurta(l.data)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {l.descricao}
                    {l.parcela_numero && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {l.parcela_numero}/{l.parcela_total}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">{moeda(Number(l.valor))}</span>
                  <Button size="sm" variant="outline" onClick={() => abrirPagamento(l)}>
                    pagar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ---------- últimos pagamentos ---------- */}
      {ultimos.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Últimos pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {ultimos.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-2">
                  <Origem l={l} />
                  <span className="w-20 shrink-0 text-sm text-muted-foreground">
                    {l.data_pagamento ? dataCurta(l.data_pagamento) : '—'}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{l.descricao}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {moeda(Number(l.valor))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              <Link href="/recorrentes" className="underline underline-offset-2">
                Ver contas recorrentes
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---------- janela de pagamento ---------- */}
      <Dialog open={!!pagando} onOpenChange={(o) => !o && setPagando(null)}>
        <DialogContent className="sm:max-w-md">
          {pagando && (
            <form action={confirmarPagamento}>
              <DialogHeader>
                <DialogTitle>Pagar conta</DialogTitle>
                <DialogDescription>
                  {pagando.descricao} · vence {dataCurta(pagando.data)}
                </DialogDescription>
              </DialogHeader>

              <input type="hidden" name="id" value={pagando.id} />

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="pag-valor">Valor</Label>
                  <Input
                    id="pag-valor"
                    name="valor"
                    inputMode="decimal"
                    required
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                  />
                  {pagando.valor_previsto &&
                    Number(pagando.valor_previsto) !== Number(valorPago) && (
                      <p className="text-xs text-muted-foreground">
                        previsto: {moeda(Number(pagando.valor_previsto))}
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pag-forma">Forma de pagamento</Label>
                  <select
                    id="pag-forma"
                    name="forma"
                    value={forma}
                    onChange={(e) => setForma(e.target.value as 'conta' | 'cartao')}
                    className={campoSelect}
                  >
                    <option value="conta">Débito em conta</option>
                    <option value="cartao">Cartão de crédito</option>
                  </select>
                </div>

                {forma === 'conta' ? (
                  <div className="space-y-2">
                    <Label htmlFor="pag-conta">Sai da conta</Label>
                    <select
                      id="pag-conta"
                      name="conta_id"
                      required
                      value={contaPago}
                      onChange={(e) => setContaPago(e.target.value)}
                      className={campoSelect}
                    >
                      <option value="">Escolher…</option>
                      {contas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {moeda(Number(c.balance))}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pag-cartao">No cartão</Label>
                    <select
                      id="pag-cartao"
                      name="cartao_id"
                      required
                      value={cartaoPago}
                      onChange={(e) => setCartaoPago(e.target.value)}
                      className={campoSelect}
                    >
                      <option value="">Escolher…</option>
                      {cartoes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Não sai do saldo agora — entra na fatura e é paga no
                      vencimento do cartão.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pag-data">
                    {forma === 'conta' ? 'Data do pagamento' : 'Data da compra'}
                  </Label>
                  <Input
                    id="pag-data"
                    name="data_pagamento"
                    type="date"
                    required
                    value={dataPago}
                    onChange={(e) => setDataPago(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={pendente}>
                  {pendente ? 'Registrando…' : 'Confirmar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
