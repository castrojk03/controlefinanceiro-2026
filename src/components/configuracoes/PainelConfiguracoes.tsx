'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  criarConta,
  atualizarConta,
  excluirConta,
  criarCartao,
  atualizarCartao,
  excluirCartao,
} from '@/app/(app)/configuracoes/actions';
import type { Conta, Cartao, Area } from '@/types/financeiro';
import { CORES, ROTULO_CLASSIFICACAO } from '@/types/financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Plus, CreditCard, Wallet } from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  contas: Conta[];
  cartoes: Cartao[];
  areas: Area[];
  erro: string | null;
}

export function PainelConfiguracoes({ contas, cartoes, areas, erro }: Props) {
  const [pendente, iniciar] = useTransition();

  const [contaAberta, setContaAberta] = useState(false);
  const [contaEditando, setContaEditando] = useState<Conta | null>(null);

  const [cartaoAberto, setCartaoAberto] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState<Cartao | null>(null);
  const [tipoCartao, setTipoCartao] = useState<string>('Crédito');

  function enviar(
    acao: (fd: FormData) => Promise<{ erro: string } | { ok: true }>,
    aoConcluir: () => void,
    mensagem: string
  ) {
    return (formData: FormData) => {
      iniciar(async () => {
        const r = await acao(formData);
        if ('erro' in r) {
          toast.error(r.erro);
          return;
        }
        toast.success(mensagem);
        aoConcluir();
      });
    };
  }

  function remover(
    acao: (id: string) => Promise<{ erro: string } | { ok: true }>,
    id: string,
    nome: string
  ) {
    if (!confirm(`Excluir "${nome}"? Isso não pode ser desfeito.`)) return;
    iniciar(async () => {
      const r = await acao(id);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Excluído.');
    });
  }

  function abrirConta(conta: Conta | null) {
    setContaEditando(conta);
    setContaAberta(true);
  }

  function abrirCartao(cartao: Cartao | null) {
    setCartaoEditando(cartao);
    setTipoCartao(cartao?.type ?? 'Crédito');
    setCartaoAberto(true);
  }

  const saldoTotal = contas.reduce((soma, c) => soma + Number(c.balance), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Contas, cartões e as áreas que classificam seus gastos.
        </p>
      </header>

      {erro && (
        <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Não foi possível carregar: {erro}
        </div>
      )}

      <Tabs defaultValue="contas">
        <TabsList>
          <TabsTrigger value="contas">Contas</TabsTrigger>
          <TabsTrigger value="cartoes">Cartões</TabsTrigger>
          <TabsTrigger value="areas">Áreas e categorias</TabsTrigger>
        </TabsList>

        {/* ---------------- CONTAS ---------------- */}
        <TabsContent value="contas" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-4 w-4" />
                  Contas
                </CardTitle>
                {contas.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Saldo somado: <strong>{moeda(saldoTotal)}</strong>
                  </p>
                )}
              </div>
              <Button onClick={() => abrirConta(null)} size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Nova conta
              </Button>
            </CardHeader>
            <CardContent>
              {contas.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma conta ainda. Cadastre onde seu dinheiro fica para começar.
                </p>
              ) : (
                <ul className="divide-y">
                  {contas.map((conta) => (
                    <li
                      key={conta.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span
                        aria-hidden
                        className="h-8 w-1.5 shrink-0 rounded-full"
                        style={{ background: conta.color }}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {conta.name}
                      </span>
                      <span className="tabular-nums">{moeda(Number(conta.balance))}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirConta(conta)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remover(excluirConta, conta.id, conta.name)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- CARTÕES ---------------- */}
        <TabsContent value="cartoes" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-4 w-4" />
                Cartões
              </CardTitle>
              <Button onClick={() => abrirCartao(null)} size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Novo cartão
              </Button>
            </CardHeader>
            <CardContent>
              {cartoes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum cartão ainda. Cadastre com o dia de fechamento e vencimento
                  para o app prever suas faturas.
                </p>
              ) : (
                <ul className="divide-y">
                  {cartoes.map((cartao) => {
                    const conta = contas.find((c) => c.id === cartao.account_id);
                    return (
                      <li
                        key={cartao.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <span
                          aria-hidden
                          className="h-8 w-1.5 shrink-0 rounded-full"
                          style={{ background: cartao.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {cartao.name}
                            {cartao.last_digits && (
                              <span className="text-muted-foreground">
                                {' '}
                                ·{cartao.last_digits}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {cartao.type}
                            {cartao.type === 'Crédito' && cartao.closing_day && (
                              <>
                                {' · '}fecha dia {cartao.closing_day} · vence dia{' '}
                                {cartao.due_day}
                              </>
                            )}
                            {conta && <> · {conta.name}</>}
                          </p>
                        </div>
                        {cartao.type === 'Crédito' && (
                          <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
                            limite {moeda(Number(cartao.credit_limit))}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirCartao(cartao)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remover(excluirCartao, cartao.id, cartao.name)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- ÁREAS ---------------- */}
        <TabsContent value="areas" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Áreas e categorias</CardTitle>
              <p className="text-sm text-muted-foreground">
                Semeadas a partir da sua planilha. A classificação alimenta a proporção
                50-35-15 nos relatórios.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {areas.map((area) => (
                  <li key={area.id} className="flex items-center gap-3 py-2.5">
                    <span
                      aria-hidden
                      className="h-6 w-1.5 shrink-0 rounded-full"
                      style={{ background: area.color }}
                    />
                    <span className="min-w-0 flex-1 truncate">{area.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {area.classificacao
                        ? ROTULO_CLASSIFICACAO[area.classificacao]
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                Editar áreas e categorias entra numa próxima etapa.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------- FORMULÁRIO DE CONTA ---------------- */}
      <Dialog open={contaAberta} onOpenChange={setContaAberta}>
        <DialogContent>
          <form
            action={enviar(
              contaEditando ? atualizarConta : criarConta,
              () => setContaAberta(false),
              contaEditando ? 'Conta atualizada.' : 'Conta criada.'
            )}
          >
            <DialogHeader>
              <DialogTitle>{contaEditando ? 'Editar conta' : 'Nova conta'}</DialogTitle>
              <DialogDescription>
                O saldo pode ser ajustado à mão a qualquer momento.
              </DialogDescription>
            </DialogHeader>

            {contaEditando && <input type="hidden" name="id" value={contaEditando.id} />}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="conta-nome">Nome</Label>
                <Input
                  id="conta-nome"
                  name="nome"
                  required
                  defaultValue={contaEditando?.name ?? ''}
                  placeholder="Nubank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta-saldo">Saldo atual</Label>
                <Input
                  id="conta-saldo"
                  name="saldo"
                  inputMode="decimal"
                  defaultValue={contaEditando ? String(contaEditando.balance) : '0'}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {CORES.map((cor, i) => (
                    <label key={cor} className="cursor-pointer">
                      <input
                        type="radio"
                        name="cor"
                        value={cor}
                        defaultChecked={
                          contaEditando ? contaEditando.color === cor : i === 0
                        }
                        className="peer sr-only"
                      />
                      <span
                        className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2"
                        style={{ background: cor }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pendente}>
                {pendente ? 'Salvando…' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------- FORMULÁRIO DE CARTÃO ---------------- */}
      <Dialog open={cartaoAberto} onOpenChange={setCartaoAberto}>
        <DialogContent>
          <form
            action={enviar(
              cartaoEditando ? atualizarCartao : criarCartao,
              () => setCartaoAberto(false),
              cartaoEditando ? 'Cartão atualizado.' : 'Cartão criado.'
            )}
          >
            <DialogHeader>
              <DialogTitle>
                {cartaoEditando ? 'Editar cartão' : 'Novo cartão'}
              </DialogTitle>
              <DialogDescription>
                Fechamento e vencimento são o que permite prever a fatura.
              </DialogDescription>
            </DialogHeader>

            {cartaoEditando && (
              <input type="hidden" name="id" value={cartaoEditando.id} />
            )}
            <input type="hidden" name="tipo" value={tipoCartao} />

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cartao-nome">Nome</Label>
                  <Input
                    id="cartao-nome"
                    name="nome"
                    required
                    defaultValue={cartaoEditando?.name ?? ''}
                    placeholder="Nubank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cartao-finais">4 últimos dígitos</Label>
                  <Input
                    id="cartao-finais"
                    name="finais"
                    maxLength={4}
                    inputMode="numeric"
                    defaultValue={cartaoEditando?.last_digits ?? ''}
                    placeholder="0134"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipoCartao} onValueChange={setTipoCartao}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Crédito">Crédito</SelectItem>
                      <SelectItem value="Débito">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cartao-conta">Conta vinculada</Label>
                  <select
                    id="cartao-conta"
                    name="conta_id"
                    defaultValue={cartaoEditando?.account_id ?? ''}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Nenhuma</option>
                    {contas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {tipoCartao === 'Crédito' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cartao-limite">Limite</Label>
                    <Input
                      id="cartao-limite"
                      name="limite"
                      inputMode="decimal"
                      defaultValue={
                        cartaoEditando ? String(cartaoEditando.credit_limit) : ''
                      }
                      placeholder="2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cartao-fechamento">Fecha dia</Label>
                    <Input
                      id="cartao-fechamento"
                      name="fechamento"
                      type="number"
                      min={1}
                      max={31}
                      defaultValue={cartaoEditando?.closing_day ?? ''}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cartao-vencimento">Vence dia</Label>
                    <Input
                      id="cartao-vencimento"
                      name="vencimento"
                      type="number"
                      min={1}
                      max={31}
                      defaultValue={cartaoEditando?.due_day ?? ''}
                      placeholder="12"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {CORES.map((cor, i) => (
                    <label key={cor} className="cursor-pointer">
                      <input
                        type="radio"
                        name="cor"
                        value={cor}
                        defaultChecked={
                          cartaoEditando ? cartaoEditando.color === cor : i === 0
                        }
                        className="peer sr-only"
                      />
                      <span
                        className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2"
                        style={{ background: cor }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pendente}>
                {pendente ? 'Salvando…' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
