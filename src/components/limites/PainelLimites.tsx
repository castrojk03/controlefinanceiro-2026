'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { salvarLimite, excluirLimite } from '@/app/(app)/limites/actions';
import type { Area, Categoria } from '@/types/financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  CalendarRange,
} from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_CURTOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const campoSelect =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export interface LimiteBruto {
  id: string;
  area_id: string;
  categoria_id: string | null;
  valor: number;
  mes: number | null;
  ano: number | null;
  inicio: string | null;
  fim: string | null;
}

interface CategoriaComLimite {
  categoriaId: string;
  nome: string;
  gasto: number;
  limite: LimiteBruto | null;
}

export interface LinhaDeLimite {
  areaId: string;
  nome: string;
  gasto: number;
  limite: LimiteBruto | null;
  /** Gasto somado do período inteiro, quando o limite vigente é de período. */
  acumulado: number | null;
  categorias: CategoriaComLimite[];
}

interface Props {
  linhas: LinhaDeLimite[];
  areas: Area[];
  categorias: Categoria[];
  mes: number;
  ano: number;
  totalLimite: number;
  totalGasto: number;
  diasNoMes: number;
  diaCorrente: number | null;
  erro: string | null;
}

/** "out–dez" ou "out/26–jan/27" quando atravessa o ano. */
function periodoLegivel(inicio: string, fim: string): string {
  const [anoDe, mesDe] = inicio.split('-').map(Number);
  const [anoAte, mesAte] = fim.split('-').map(Number);
  const de = MESES_CURTOS[mesDe - 1];
  const ate = MESES_CURTOS[mesAte - 1];
  return anoDe === anoAte
    ? `${de}–${ate}`
    : `${de}/${String(anoDe).slice(2)}–${ate}/${String(anoAte).slice(2)}`;
}

function Barra({ usado, teto }: { usado: number; teto: number | null }) {
  if (!teto) {
    return (
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-0" />
      </div>
    );
  }

  const fracao = usado / teto;
  const estourou = fracao > 1;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${
          estourou
            ? 'bg-destructive'
            : fracao > 0.85
              ? 'bg-amber-500'
              : 'bg-foreground/70'
        }`}
        style={{ width: `${Math.min(100, fracao * 100)}%` }}
      />
    </div>
  );
}

export function PainelLimites({
  linhas,
  areas,
  categorias,
  mes,
  ano,
  totalLimite,
  totalGasto,
  diasNoMes,
  diaCorrente,
  erro,
}: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<{
    limite: LimiteBruto | null;
    areaId: string;
    categoriaId: string | null;
    nome: string;
  } | null>(null);
  const [tipo, setTipo] = useState('permanente');

  const anterior = mes === 1 ? { mes: 12, ano: ano - 1 } : { mes: mes - 1, ano };
  const seguinte = mes === 12 ? { mes: 1, ano: ano + 1 } : { mes: mes + 1, ano };

  function alternar(id: string) {
    setAbertas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function abrirEdicao(
    limite: LimiteBruto | null,
    areaId: string,
    categoriaId: string | null,
    nome: string
  ) {
    setTipo(limite?.inicio ? 'periodo' : limite?.mes ? 'mensal' : 'permanente');
    setEditando({ limite, areaId, categoriaId, nome });
  }

  function enviar(dados: FormData) {
    iniciar(async () => {
      const r = await salvarLimite(dados);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Limite salvo.');
      setEditando(null);
      router.refresh();
    });
  }

  function remover(id: string) {
    iniciar(async () => {
      const r = await excluirLimite(id);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Limite removido.');
      setEditando(null);
      router.refresh();
    });
  }

  if (erro) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        Não foi possível carregar os limites: {erro}
      </div>
    );
  }

  const percentualDoMes = diaCorrente
    ? Math.round((diaCorrente / diasNoMes) * 100)
    : null;

  const mesAtual = `${ano}-${String(mes).padStart(2, '0')}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Limites</h1>
          <p className="text-sm text-muted-foreground">
            Teto de custo por área. Nada trava — ficar abaixo é o objetivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1" aria-label="Trocar de mês">
            <Link
              href={`/limites?mes=${anterior.mes}&ano=${anterior.ano}`}
              aria-label="Mês anterior"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="min-w-[130px] text-center text-sm font-medium">
              {MESES[mes - 1]} {ano}
            </span>
            <Link
              href={`/limites?mes=${seguinte.mes}&ano=${seguinte.ano}`}
              aria-label="Próximo mês"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>

          <Button
            size="sm"
            onClick={() => abrirEdicao(null, '', null, 'Novo limite')}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Novo
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="mb-1 text-sm text-muted-foreground">Limite total</p>
            <p className="text-xl font-semibold tabular-nums">
              {totalLimite > 0 ? moeda(totalLimite) : '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              soma dos limites mensais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="mb-1 text-sm text-muted-foreground">Executado</p>
            <p
              className={`text-xl font-semibold tabular-nums ${
                totalLimite > 0 && totalGasto > totalLimite
                  ? 'text-destructive'
                  : ''
              }`}
            >
              {moeda(totalGasto)}
            </p>
            {totalLimite > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round((totalGasto / totalLimite) * 100)}% do limite
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="mb-1 text-sm text-muted-foreground">
              {diaCorrente ? `Dia ${diaCorrente} de ${diasNoMes}` : 'Mês fechado'}
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {percentualDoMes !== null ? `${percentualDoMes}%` : '100%'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">do mês corrido</p>
          </CardContent>
        </Card>
      </div>

      {linhas.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum limite definido e nenhum gasto em {MESES[mes - 1].toLowerCase()}.
            <br />
            Use o botão <strong>Novo</strong> para definir o primeiro teto.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-5 pt-5">
            {linhas.map((linha) => {
              const aberta = abertas.has(linha.areaId);
              const ehPeriodo = !!linha.limite?.inicio;
              const teto = linha.limite ? Number(linha.limite.valor) : null;

              // Num teto de período o que conta é o acumulado, não o mês.
              const usado = ehPeriodo ? (linha.acumulado ?? 0) : linha.gasto;
              const resta = teto !== null ? teto - usado : null;

              return (
                <div key={linha.areaId} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="flex items-center gap-1.5">
                      {linha.categorias.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => alternar(linha.areaId)}
                          aria-expanded={aberta}
                          className="flex items-center gap-1 font-medium hover:text-foreground"
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                              aberta ? '' : '-rotate-90'
                            }`}
                          />
                          {linha.nome}
                        </button>
                      ) : (
                        <span className="pl-[18px] font-medium">{linha.nome}</span>
                      )}

                      {ehPeriodo && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                          <CalendarRange className="h-3 w-3" />
                          {periodoLegivel(linha.limite!.inicio!, linha.limite!.fim!)}
                        </span>
                      )}
                      {linha.limite?.mes && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                          só este mês
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          abrirEdicao(linha.limite, linha.areaId, null, linha.nome)
                        }
                        aria-label={`Editar limite de ${linha.nome}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </span>

                    <span className="tabular-nums">
                      {moeda(usado)}
                      <span className="text-muted-foreground">
                        {' / '}
                        {teto !== null ? moeda(teto) : 'sem limite'}
                      </span>
                    </span>
                  </div>

                  <Barra usado={usado} teto={teto} />

                  {ehPeriodo && (
                    <p className="text-xs text-muted-foreground">
                      {MESES[mes - 1].toLowerCase()}: {moeda(linha.gasto)} ·{' '}
                      {resta !== null && resta >= 0
                        ? `restam ${moeda(resta)} até ${
                            MESES_CURTOS[
                              Number(linha.limite!.fim!.split('-')[1]) - 1
                            ]
                          }`
                        : `estourou ${moeda(Math.abs(resta ?? 0))}`}
                    </p>
                  )}

                  {aberta && (
                    <ul className="ml-5 mt-2 space-y-2.5 border-l pl-4">
                      {linha.categorias.map((c) => {
                        const tetoC = c.limite ? Number(c.limite.valor) : null;
                        return (
                          <li key={c.categoriaId} className="space-y-1">
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                              <span className="flex items-center gap-1.5">
                                {c.nome}
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirEdicao(
                                      c.limite,
                                      linha.areaId,
                                      c.categoriaId,
                                      `${linha.nome} · ${c.nome}`
                                    )
                                  }
                                  aria-label={`Editar limite de ${c.nome}`}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="h-2.5 w-2.5" />
                                </button>
                              </span>
                              <span className="tabular-nums text-muted-foreground">
                                {moeda(c.gasto)}
                                {' / '}
                                {tetoC !== null ? moeda(tetoC) : 'sem limite'}
                              </span>
                            </div>
                            {tetoC !== null && (
                              <Barra usado={c.gasto} teto={tetoC} />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Definir limite                                              */}
      {/* ---------------------------------------------------------- */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <form action={enviar}>
            <DialogHeader>
              <DialogTitle>
                {editando?.limite ? 'Editar limite' : 'Novo limite'}
              </DialogTitle>
              <DialogDescription>
                O limite é referência, não trava: nenhum lançamento é
                bloqueado por causa dele.
              </DialogDescription>
            </DialogHeader>

            <input type="hidden" name="id" value={editando?.limite?.id ?? ''} />
            <input type="hidden" name="tipo" value={tipo} />

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lim-area">Área</Label>
                  <select
                    id="lim-area"
                    name="area_id"
                    required
                    defaultValue={editando?.areaId ?? ''}
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
                  <Label htmlFor="lim-categoria">Categoria</Label>
                  <select
                    id="lim-categoria"
                    name="categoria_id"
                    defaultValue={editando?.categoriaId ?? ''}
                    className={campoSelect}
                  >
                    <option value="">A área toda</option>
                    {categorias
                      .filter((c) => c.area_id === editando?.areaId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lim-valor">Valor do limite</Label>
                <Input
                  id="lim-valor"
                  name="valor"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                  defaultValue={
                    editando?.limite ? String(editando.limite.valor) : ''
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lim-tipo">Vale quando</Label>
                <select
                  id="lim-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className={campoSelect}
                >
                  <option value="permanente">Todo mês</option>
                  <option value="mensal">Só neste mês</option>
                  <option value="periodo">Num período, somando os meses</option>
                </select>
              </div>

              {tipo === 'mensal' && (
                <>
                  <input type="hidden" name="mes" value={mes} />
                  <input type="hidden" name="ano" value={ano} />
                  <p className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                    Vale só em {MESES[mes - 1].toLowerCase()} de {ano},
                    sobrepondo o limite permanente. Nos outros meses, o
                    permanente volta a valer.
                  </p>
                </>
              )}

              {tipo === 'periodo' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lim-inicio">De</Label>
                      <Input
                        id="lim-inicio"
                        name="inicio"
                        type="month"
                        required
                        defaultValue={
                          editando?.limite?.inicio?.slice(0, 7) ?? mesAtual
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lim-fim">Até</Label>
                      <Input
                        id="lim-fim"
                        name="fim"
                        type="month"
                        required
                        defaultValue={
                          editando?.limite?.fim?.slice(0, 7) ?? mesAtual
                        }
                      />
                    </div>
                  </div>
                  <p className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                    O valor é o teto do período inteiro, não de cada mês:
                    gastar mais num mês deixa menos para os outros.
                  </p>
                </>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              {editando?.limite ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pendente}
                  onClick={() => remover(editando.limite!.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remover
                </Button>
              ) : (
                <span />
              )}

              <span className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditando(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={pendente}>
                  {pendente ? 'Salvando…' : 'Salvar'}
                </Button>
              </span>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
