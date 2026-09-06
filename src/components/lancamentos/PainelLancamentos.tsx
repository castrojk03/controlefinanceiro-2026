'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  criarLancamento,
  atualizarLancamento,
  excluirLancamento,
} from '@/app/(app)/lancamentos/actions';
import { pagarLancamento } from '@/app/(app)/actions';
import type {
  Conta,
  Cartao,
  Area,
  Categoria,
  Origem,
  Lancamento,
} from '@/types/financeiro';
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
import { Plus, Pencil, Trash2, Bot, Zap, ArrowUp, ArrowDown } from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const dataBR = (iso: string) => iso.split('-').reverse().join('/');

const hojeISO = () => new Date().toISOString().slice(0, 10);

const campoSelect =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const ROTULO_STATUS: Record<string, string> = {
  previsto: 'Previsto',
  pendente: 'Pendente',
  pago: 'Pago',
};

interface Filtros {
  de: string;
  ate: string;
  tipo?: string;
  status?: string;
  area?: string;
  responsavel?: string;
  origem?: string;
  busca?: string;
}

interface Props {
  lancamentos: Lancamento[];
  contas: Conta[];
  cartoes: Cartao[];
  areas: Area[];
  categorias: Categoria[];
  origens: Origem[];
  filtros: Filtros;
  erro: string | null;
}

export function PainelLancamentos({
  lancamentos,
  contas,
  cartoes,
  areas,
  categorias,
  origens,
  filtros,
  erro,
}: Props) {
  const router = useRouter();
  const caminho = usePathname();
  const [pendente, iniciar] = useTransition();

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);

  // Baixa rápida, sem passar pela edição completa
  const [pagando, setPagando] = useState<Lancamento | null>(null);
  const [valorPago, setValorPago] = useState('');
  const [dataPago, setDataPago] = useState(hojeISO);
  const [contaPago, setContaPago] = useState('');
  const [cartaoPago, setCartaoPago] = useState('');
  const [formaPago, setFormaPago] = useState<'conta' | 'cartao'>('conta');

  // Campos que mudam a cara do formulário
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [status, setStatus] = useState<'previsto' | 'pendente' | 'pago'>('pago');
  const [areaId, setAreaId] = useState('');

  const categoriasDaArea = useMemo(
    () => categorias.filter((c) => c.area_id === areaId),
    [categorias, areaId]
  );

  function trocarFiltro(chave: string, valor: string) {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    router.push(`${caminho}?${params.toString()}`);
  }

  function abrirNovo() {
    setEditando(null);
    setTipo('saida');
    setStatus('pago');
    setAreaId('');
    setAberto(true);
  }

  function abrirEdicao(l: Lancamento) {
    setEditando(l);
    setTipo(l.tipo);
    setStatus(l.status);
    setAreaId(l.area_id ?? '');
    setAberto(true);
  }

  function abrirPagamento(l: Lancamento) {
    setPagando(l);
    setValorPago(String(l.valor));
    setDataPago(hojeISO());
    setFormaPago(l.cartao_id ? 'cartao' : 'conta');
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

  function enviar(formData: FormData) {
    iniciar(async () => {
      const r = editando
        ? await atualizarLancamento(formData)
        : await criarLancamento(formData);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success(editando ? 'Lançamento atualizado.' : 'Lançamento criado.');
      setAberto(false);
    });
  }

  function excluir(l: Lancamento) {
    if (!confirm(`Excluir "${l.descricao}"? Isso não pode ser desfeito.`)) return;
    iniciar(async () => {
      const r = await excluirLancamento(l.id);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Excluído.');
    });
  }

  const entradas = lancamentos
    .filter((l) => l.tipo === 'entrada')
    .reduce((s, l) => s + Number(l.valor), 0);
  const saidas = lancamentos
    .filter((l) => l.tipo === 'saida')
    .reduce((s, l) => s + Number(l.valor), 0);

  const nome = (id: string | null, lista: { id: string; name?: string; nome?: string }[]) =>
    lista.find((x) => x.id === id)?.name ??
    lista.find((x) => x.id === id)?.nome ??
    '—';

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lançamentos</h1>
          <p className="text-muted-foreground">
            Tudo que entrou e saiu — e onde se corrige o que o agente errou.
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo lançamento
        </Button>
      </header>

      {erro && (
        <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Não foi possível carregar: {erro}
        </div>
      )}

      {/* ---------- filtros ---------- */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="f-de" className="text-xs">
              De
            </Label>
            <Input
              id="f-de"
              type="date"
              value={filtros.de}
              onChange={(e) => trocarFiltro('de', e.target.value)}
              className="h-9 w-36"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-ate" className="text-xs">
              Até
            </Label>
            <Input
              id="f-ate"
              type="date"
              value={filtros.ate}
              onChange={(e) => trocarFiltro('ate', e.target.value)}
              className="h-9 w-36"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-tipo" className="text-xs">
              Tipo
            </Label>
            <select
              id="f-tipo"
              value={filtros.tipo ?? ''}
              onChange={(e) => trocarFiltro('tipo', e.target.value)}
              className={`${campoSelect} h-9 w-32`}
            >
              <option value="">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-status" className="text-xs">
              Status
            </Label>
            <select
              id="f-status"
              value={filtros.status ?? ''}
              onChange={(e) => trocarFiltro('status', e.target.value)}
              className={`${campoSelect} h-9 w-32`}
            >
              <option value="">Todos</option>
              <option value="previsto">Previsto</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-area" className="text-xs">
              Área
            </Label>
            <select
              id="f-area"
              value={filtros.area ?? ''}
              onChange={(e) => trocarFiltro('area', e.target.value)}
              className={`${campoSelect} h-9 w-40`}
            >
              <option value="">Todas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-resp" className="text-xs">
              Quem
            </Label>
            <select
              id="f-resp"
              value={filtros.responsavel ?? ''}
              onChange={(e) => trocarFiltro('responsavel', e.target.value)}
              className={`${campoSelect} h-9 w-28`}
            >
              <option value="">Todos</option>
              <option value="john">John</option>
              <option value="amanda">Amanda</option>
              <option value="casal">Casal</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-origem" className="text-xs">
              Origem
            </Label>
            <select
              id="f-origem"
              value={filtros.origem ?? ''}
              onChange={(e) => trocarFiltro('origem', e.target.value)}
              className={`${campoSelect} h-9 w-32`}
            >
              <option value="">Todas</option>
              <option value="agente">Agente</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ---------- lista ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">
              {lancamentos.length} lançamento
              {lancamentos.length === 1 ? '' : 's'}
            </CardTitle>
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                entradas <strong className="tabular-nums">{moeda(entradas)}</strong>
              </span>
              <span className="text-muted-foreground">
                saídas <strong className="tabular-nums">{moeda(saidas)}</strong>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lancamentos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum lançamento no período. Ajuste os filtros ou crie um novo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-2 font-medium" />
                    <th className="pb-2 pr-3 font-medium">Data</th>
                    <th className="pb-2 pr-3 font-medium">Descrição</th>
                    <th className="pb-2 pr-3 font-medium">Classificação</th>
                    <th className="pb-2 pr-3 text-right font-medium">Valor</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Quem</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-2">
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          {l.origem === 'agente' ? (
                            <Bot className="h-3.5 w-3.5" aria-label="agente" />
                          ) : (
                            <Zap className="h-3.5 w-3.5" aria-label="manual" />
                          )}
                          {l.editado_em && (
                            <Pencil className="h-3 w-3" aria-label="editado" />
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                        {dataBR(l.data)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-1.5">
                          {l.tipo === 'entrada' ? (
                            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          {l.descricao}
                          {l.parcela_numero && (
                            <span className="text-muted-foreground">
                              {' '}
                              {l.parcela_numero}/{l.parcela_total}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {l.tipo === 'entrada'
                          ? nome(l.origem_id, origens)
                          : nome(l.area_id, areas)}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-right tabular-nums">
                        {moeda(Number(l.valor))}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={
                            l.status === 'pago'
                              ? 'text-muted-foreground'
                              : 'font-medium'
                          }
                        >
                          {ROTULO_STATUS[l.status]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 capitalize text-muted-foreground">
                        {l.responsavel}
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1">
                          {l.status !== 'pago' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirPagamento(l)}
                            >
                              pagar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEdicao(l)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => excluir(l)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- baixa rápida ---------- */}
      <Dialog open={!!pagando} onOpenChange={(o) => !o && setPagando(null)}>
        <DialogContent className="sm:max-w-md">
          {pagando && (
            <form action={confirmarPagamento}>
              <DialogHeader>
                <DialogTitle>
                  {pagando.tipo === 'entrada' ? 'Registrar recebimento' : 'Pagar conta'}
                </DialogTitle>
                <DialogDescription>
                  {pagando.descricao} · {dataBR(pagando.data)}
                </DialogDescription>
              </DialogHeader>

              <input type="hidden" name="id" value={pagando.id} />

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bx-valor">Valor</Label>
                  <Input
                    id="bx-valor"
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

                {pagando.tipo === 'saida' && (
                  <div className="space-y-2">
                    <Label htmlFor="bx-forma">Forma de pagamento</Label>
                    <select
                      id="bx-forma"
                      name="forma"
                      value={formaPago}
                      onChange={(e) =>
                        setFormaPago(e.target.value as 'conta' | 'cartao')
                      }
                      className={campoSelect}
                    >
                      <option value="conta">Débito em conta</option>
                      <option value="cartao">Cartão de crédito</option>
                    </select>
                  </div>
                )}

                {pagando.tipo === 'saida' && formaPago === 'cartao' ? (
                  <div className="space-y-2">
                    <Label htmlFor="bx-cartao">No cartão</Label>
                    <select
                      id="bx-cartao"
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
                      Não sai do saldo agora — entra na fatura.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="bx-conta">
                      {pagando.tipo === 'entrada' ? 'Entra na conta' : 'Sai da conta'}
                    </Label>
                    <select
                      id="bx-conta"
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
                )}

                <div className="space-y-2">
                  <Label htmlFor="bx-data">
                    {pagando.tipo === 'entrada' ? 'Data do recebimento' : 'Data do pagamento'}
                  </Label>
                  <Input
                    id="bx-data"
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

      {/* ---------- formulário ---------- */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form action={enviar}>
            <DialogHeader>
              <DialogTitle>
                {editando ? 'Editar lançamento' : 'Novo lançamento'}
              </DialogTitle>
              <DialogDescription>
                {editando
                  ? 'Editar desliga este lançamento da recorrência que o gerou.'
                  : 'Um gasto ou receita avulsa, fora das contas recorrentes.'}
              </DialogDescription>
            </DialogHeader>

            {editando && <input type="hidden" name="id" value={editando.id} />}
            <input type="hidden" name="tipo" value={tipo} />
            <input type="hidden" name="status" value={status} />

            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={tipo === 'saida' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipo('saida')}
                >
                  Saída
                </Button>
                <Button
                  type="button"
                  variant={tipo === 'entrada' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipo('entrada')}
                >
                  Entrada
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="l-descricao">Descrição</Label>
                <Input
                  id="l-descricao"
                  name="descricao"
                  required
                  defaultValue={editando?.descricao ?? ''}
                  placeholder={tipo === 'entrada' ? 'Salário' : 'Almoço'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="l-valor">Valor</Label>
                  <Input
                    id="l-valor"
                    name="valor"
                    inputMode="decimal"
                    required
                    defaultValue={editando ? String(editando.valor) : ''}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-data">
                    {tipo === 'entrada' ? 'Data de entrada' : 'Data'}
                  </Label>
                  <Input
                    id="l-data"
                    name="data"
                    type="date"
                    required
                    defaultValue={editando?.data ?? hojeISO()}
                  />
                </div>
              </div>

              {tipo === 'entrada' ? (
                <div className="space-y-2">
                  <Label htmlFor="l-origem">Origem</Label>
                  <select
                    id="l-origem"
                    name="origem_id"
                    required
                    defaultValue={editando?.origem_id ?? ''}
                    className={campoSelect}
                  >
                    <option value="">Escolher…</option>
                    <optgroup label="Fixas">
                      {origens
                        .filter((o) => o.tipo === 'fixa')
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.nome}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Variáveis">
                      {origens
                        .filter((o) => o.tipo === 'variavel')
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.nome}
                            {o.tributada ? ' · tributada' : ''}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="l-area">Área</Label>
                    <select
                      id="l-area"
                      name="area_id"
                      value={areaId}
                      onChange={(e) => setAreaId(e.target.value)}
                      className={campoSelect}
                    >
                      <option value="">Escolher…</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="l-categoria">Categoria</Label>
                    <select
                      id="l-categoria"
                      name="categoria_id"
                      defaultValue={editando?.categoria_id ?? ''}
                      disabled={!areaId}
                      className={campoSelect}
                    >
                      <option value="">
                        {areaId ? 'Escolher…' : 'Escolha a área antes'}
                      </option>
                      {categoriasDaArea.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="l-status">Situação</Label>
                <select
                  id="l-status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'previsto' | 'pendente' | 'pago')
                  }
                  className={campoSelect}
                >
                  <option value="pago">
                    {tipo === 'entrada' ? 'Já recebi' : 'Já paguei'}
                  </option>
                  <option value="previsto">Previsto</option>
                  <option value="pendente">Pendente — falta informação</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="l-conta">
                    {tipo === 'entrada' ? 'Entra na conta' : 'Sai da conta'}
                  </Label>
                  <select
                    id="l-conta"
                    name="conta_id"
                    defaultValue={editando?.conta_id ?? ''}
                    className={campoSelect}
                  >
                    <option value="">Nenhuma</option>
                    {contas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={tipo === 'entrada' ? 'hidden' : 'space-y-2'}>
                  <Label htmlFor="l-cartao">Ou no cartão</Label>
                  <select
                    id="l-cartao"
                    name="cartao_id"
                    defaultValue={editando?.cartao_id ?? ''}
                    className={campoSelect}
                  >
                    <option value="">Nenhum</option>
                    {cartoes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="l-resp">Responsável</Label>
                <select
                  id="l-resp"
                  name="responsavel"
                  defaultValue={editando?.responsavel ?? 'casal'}
                  className={campoSelect}
                >
                  <option value="casal">Casal</option>
                  <option value="john">John</option>
                  <option value="amanda">Amanda</option>
                </select>
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
