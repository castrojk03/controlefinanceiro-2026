'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  criarRecorrencia,
  editarRecorrencia,
  encerrarRecorrencia,
  excluirRecorrencia,
  type AlcanceEdicao,
} from '@/app/(app)/recorrentes/actions';
import { descreverRecorrencia, gerarOcorrencias } from '@/lib/recorrencia';
import type {
  Conta,
  Cartao,
  Area,
  Categoria,
  Recorrencia,
  FrequenciaRecorrencia,
  FimRecorrencia,
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
import {
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
  Ban,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';

const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const campoSelect =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface Props {
  recorrencias: Recorrencia[];
  contas: Conta[];
  cartoes: Cartao[];
  areas: Area[];
  categorias: Categoria[];
  erro: string | null;
}

export function PainelRecorrentes({
  recorrencias,
  contas,
  cartoes,
  areas,
  categorias,
  erro,
}: Props) {
  const [pendente, iniciar] = useTransition();
  const [aberto, setAberto] = useState(false);

  // Edição: qual recorrência, com que alcance e a partir de quando
  const [editando, setEditando] = useState<Recorrencia | null>(null);
  const [alcance, setAlcance] = useState<AlcanceEdicao>('seguintes');
  const [aPartirDe, setAPartirDe] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [novoValor, setNovoValor] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [areaEdicao, setAreaEdicao] = useState('');

  // Campos que mudam o formulário conforme o preenchimento
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [frequencia, setFrequencia] = useState<FrequenciaRecorrencia>('mensal');
  const [intervalo, setIntervalo] = useState(1);
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [diaDoMes, setDiaDoMes] = useState<string>('');
  const [fimTipo, setFimTipo] = useState<FimRecorrencia>('nunca');
  const [fimData, setFimData] = useState('');
  const [fimOcorrencias, setFimOcorrencias] = useState('12');
  const [inicio, setInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [areaId, setAreaId] = useState('');

  const categoriasDaArea = useMemo(
    () => categorias.filter((c) => c.area_id === areaId),
    [categorias, areaId]
  );

  /** Prévia: quantas ocorrências e quando são as primeiras. */
  const previa = useMemo(() => {
    if (!inicio) return null;
    try {
      const datas = gerarOcorrencias({
        frequencia,
        intervalo,
        dias_semana: diasSemana.length ? diasSemana : null,
        dia_do_mes: diaDoMes ? Number(diaDoMes) : null,
        inicio,
        fim_tipo: fimTipo,
        fim_data: fimData || null,
        fim_ocorrencias: fimOcorrencias ? Number(fimOcorrencias) : null,
      });
      return datas;
    } catch {
      return null;
    }
  }, [frequencia, intervalo, diasSemana, diaDoMes, inicio, fimTipo, fimData, fimOcorrencias]);

  const resumo = useMemo(
    () =>
      descreverRecorrencia({
        frequencia,
        intervalo,
        dias_semana: diasSemana.length ? diasSemana : null,
        dia_do_mes: diaDoMes ? Number(diaDoMes) : null,
        inicio,
        fim_tipo: fimTipo,
        fim_data: fimData || null,
        fim_ocorrencias: fimOcorrencias ? Number(fimOcorrencias) : null,
      }),
    [frequencia, intervalo, diasSemana, diaDoMes, inicio, fimTipo, fimData, fimOcorrencias]
  );

  function alternarDia(dia: number) {
    setDiasSemana((atual) =>
      atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort()
    );
  }

  function enviar(formData: FormData) {
    iniciar(async () => {
      const r = await criarRecorrencia(formData);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success(
        r.criadas
          ? `Cadastrada. ${r.criadas} ocorrência(s) criada(s).`
          : 'Cadastrada.'
      );
      setAberto(false);
    });
  }

  function abrirEdicao(rec: Recorrencia) {
    setEditando(rec);
    setNovoValor(String(rec.valor));
    setNovaDescricao(rec.descricao);
    setAreaEdicao(rec.area_id ?? '');
    setAlcance('seguintes');
    setAPartirDe(new Date().toISOString().slice(0, 10));
  }

  function salvarEdicao(formData: FormData) {
    iniciar(async () => {
      const r = await editarRecorrencia(formData);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Recorrência atualizada.');
      setEditando(null);
    });
  }

  function encerrar(rec: Recorrencia) {
    const hoje = new Date().toISOString().slice(0, 10);
    if (
      !confirm(
        `Encerrar "${rec.descricao}" a partir de hoje?\n\nO histórico do que já foi pago é preservado; as ocorrências futuras são removidas.`
      )
    )
      return;

    iniciar(async () => {
      const r = await encerrarRecorrencia(rec.id, hoje);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Encerrada.');
    });
  }

  function excluir(rec: Recorrencia) {
    if (!confirm(`Excluir "${rec.descricao}" e tudo que ela gerou?`)) return;
    iniciar(async () => {
      const r = await excluirRecorrencia(rec.id);
      if ('erro' in r) {
        toast.error(r.erro);
        return;
      }
      toast.success('Excluída.');
    });
  }

  const ativas = recorrencias.filter((r) => !r.encerrada_em);
  const encerradas = recorrencias.filter((r) => r.encerrada_em);

  const totalMensal = ativas
    .filter((r) => r.tipo === 'saida' && r.frequencia === 'mensal')
    .reduce((s, r) => s + Number(r.valor), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas recorrentes</h1>
          <p className="text-muted-foreground">
            O que se repete todo mês. É daqui que sai a previsão de vencimentos.
          </p>
        </div>
        <Button onClick={() => setAberto(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova conta recorrente
        </Button>
      </header>

      {erro && (
        <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Não foi possível carregar: {erro}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-4 w-4" />
            Ativas
          </CardTitle>
          {totalMensal > 0 && (
            <p className="text-sm text-muted-foreground">
              Saídas mensais fixas: <strong>{moeda(totalMensal)}</strong>
            </p>
          )}
        </CardHeader>
        <CardContent>
          {ativas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nada cadastrado ainda. Comece pelo que você sabe de cor: aluguel,
              energia, internet.
            </p>
          ) : (
            <ul className="divide-y">
              {ativas.map((rec) => {
                const area = areas.find((a) => a.id === rec.area_id);
                return (
                  <li key={rec.id} className="flex items-center gap-3 py-3">
                    {rec.tipo === 'entrada' ? (
                      <ArrowUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ArrowDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {rec.descricao}
                        {rec.valor_variavel && (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                            valor variável
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {descreverRecorrencia(rec)}
                        {area && <> · {area.name}</>}
                      </p>
                    </div>
                    <span className="tabular-nums">
                      {rec.valor_variavel && '~'}
                      {moeda(Number(rec.valor))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEdicao(rec)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => encerrar(rec)}
                      title="Encerrar"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => excluir(rec)}
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

      {encerradas.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Encerradas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {encerradas.map((rec) => (
                <li
                  key={rec.id}
                  className="flex items-center gap-3 py-2.5 text-muted-foreground"
                >
                  <span className="min-w-0 flex-1 truncate">{rec.descricao}</span>
                  <span className="text-sm">
                    encerrada em {rec.encerrada_em?.split('-').reverse().join('/')}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ---------------- EDIÇÃO ---------------- */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-md">
          {editando && (
            <form action={salvarEdicao}>
              <DialogHeader>
                <DialogTitle>Editar recorrência</DialogTitle>
                <DialogDescription>
                  Ocorrências já pagas nunca são alteradas — pagamento é
                  histórico, não previsão.
                </DialogDescription>
              </DialogHeader>

              <input type="hidden" name="id" value={editando.id} />
              <input type="hidden" name="alcance" value={alcance} />
              <input type="hidden" name="a_partir_de" value={aPartirDe} />
              <input type="hidden" name="tipo" value={editando.tipo} />
              <input type="hidden" name="frequencia" value={editando.frequencia} />
              <input type="hidden" name="intervalo" value={editando.intervalo} />
              <input type="hidden" name="inicio" value={editando.inicio} />
              <input type="hidden" name="fim_tipo" value={editando.fim_tipo} />
              {editando.fim_data && (
                <input type="hidden" name="fim_data" value={editando.fim_data} />
              )}
              {editando.fim_ocorrencias && (
                <input
                  type="hidden"
                  name="fim_ocorrencias"
                  value={editando.fim_ocorrencias}
                />
              )}
              {editando.dias_semana?.map((d) => (
                <input key={d} type="hidden" name="dias_semana" value={d} />
              ))}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Input
                    id="edit-descricao"
                    name="descricao"
                    required
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-valor">Valor</Label>
                    <Input
                      id="edit-valor"
                      name="valor"
                      inputMode="decimal"
                      required
                      value={novoValor}
                      onChange={(e) => setNovoValor(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end pb-2.5">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="valor_variavel"
                        defaultChecked={editando.valor_variavel}
                        className="h-4 w-4 rounded border-input"
                      />
                      Valor variável
                    </label>
                  </div>
                </div>

                {editando.frequencia === 'mensal' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-dia">Vence todo dia</Label>
                    <Input
                      id="edit-dia"
                      name="dia_do_mes"
                      type="number"
                      min={1}
                      max={31}
                      defaultValue={editando.dia_do_mes ?? ''}
                      className="w-24"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-area">Área</Label>
                    <select
                      id="edit-area"
                      name="area_id"
                      value={areaEdicao}
                      onChange={(e) => setAreaEdicao(e.target.value)}
                      className={campoSelect}
                    >
                      <option value="">Nenhuma</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-categoria">Categoria</Label>
                    <select
                      id="edit-categoria"
                      name="categoria_id"
                      defaultValue={editando.categoria_id ?? ''}
                      disabled={!areaEdicao}
                      className={campoSelect}
                    >
                      <option value="">Nenhuma</option>
                      {categorias
                        .filter((c) => c.area_id === areaEdicao)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-conta">Sai da conta</Label>
                    <select
                      id="edit-conta"
                      name="conta_id"
                      defaultValue={editando.conta_id ?? ''}
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
                  <div className="space-y-2">
                    <Label htmlFor="edit-cartao">Ou no cartão</Label>
                    <select
                      id="edit-cartao"
                      name="cartao_id"
                      defaultValue={editando.cartao_id ?? ''}
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
                  <Label htmlFor="edit-responsavel">Responsável</Label>
                  <select
                    id="edit-responsavel"
                    name="responsavel"
                    defaultValue={editando.responsavel}
                    className={campoSelect}
                  >
                    <option value="casal">Casal</option>
                    <option value="john">John</option>
                    <option value="amanda">Amanda</option>
                  </select>
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">Aplicar a</p>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={alcance === 'esta'}
                      onChange={() => setAlcance('esta')}
                    />
                    <span>
                      Apenas uma ocorrência
                      <span className="block text-xs text-muted-foreground">
                        Ela se desliga da regra e não muda mais junto.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={alcance === 'seguintes'}
                      onChange={() => setAlcance('seguintes')}
                    />
                    <span>
                      Esta e as seguintes
                      <span className="block text-xs text-muted-foreground">
                        As anteriores ficam como estão.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={alcance === 'todas'}
                      onChange={() => setAlcance('todas')}
                    />
                    <span>
                      Todas as ocorrências
                      <span className="block text-xs text-muted-foreground">
                        Inclusive as que já passaram e não foram pagas.
                      </span>
                    </span>
                  </label>

                  {alcance !== 'todas' && (
                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="edit-data" className="text-xs">
                        {alcance === 'esta' ? 'Qual ocorrência' : 'A partir de'}
                      </Label>
                      <Input
                        id="edit-data"
                        type="date"
                        value={aPartirDe}
                        onChange={(e) => setAPartirDe(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={pendente}>
                  {pendente ? 'Salvando…' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------- FORMULÁRIO ---------------- */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form action={enviar}>
            <DialogHeader>
              <DialogTitle>Nova conta recorrente</DialogTitle>
              <DialogDescription>
                As ocorrências são criadas agora, para o calendário já mostrar o
                que vem pela frente.
              </DialogDescription>
            </DialogHeader>

            <input type="hidden" name="tipo" value={tipo} />
            <input type="hidden" name="frequencia" value={frequencia} />
            <input type="hidden" name="fim_tipo" value={fimTipo} />
            {diasSemana.map((d) => (
              <input key={d} type="hidden" name="dias_semana" value={d} />
            ))}

            <div className="space-y-4 py-4">
              {/* tipo */}
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
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  name="descricao"
                  required
                  placeholder="Conta de Energia (Enel)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    name="valor"
                    inputMode="decimal"
                    required
                    placeholder="150,00"
                  />
                </div>
                <div className="flex items-end pb-2.5">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="valor_variavel"
                      className="h-4 w-4 rounded border-input"
                    />
                    Valor variável
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="area_id">Área</Label>
                  <select
                    id="area_id"
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
                  <Label htmlFor="categoria_id">Categoria</Label>
                  <select
                    id="categoria_id"
                    name="categoria_id"
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="conta_id">Sai da conta</Label>
                  <select id="conta_id" name="conta_id" className={campoSelect}>
                    <option value="">Nenhuma</option>
                    {contas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cartao_id">Ou no cartão</Label>
                  <select id="cartao_id" name="cartao_id" className={campoSelect}>
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
                <Label htmlFor="responsavel">Responsável</Label>
                <select
                  id="responsavel"
                  name="responsavel"
                  defaultValue="casal"
                  className={campoSelect}
                >
                  <option value="casal">Casal</option>
                  <option value="john">John</option>
                  <option value="amanda">Amanda</option>
                </select>
              </div>

              {/* ---- recorrência ---- */}
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">Repetição</p>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>A cada</span>
                  <Input
                    name="intervalo"
                    type="number"
                    min={1}
                    max={99}
                    value={intervalo}
                    onChange={(e) => setIntervalo(Number(e.target.value) || 1)}
                    className="w-16"
                  />
                  <select
                    value={frequencia}
                    onChange={(e) => {
                      const nova = e.target.value as FrequenciaRecorrencia;
                      setFrequencia(nova);
                      // Limpa o que pertence só à frequência anterior, senão
                      // o campo escondido continua sendo enviado.
                      if (nova !== 'mensal') setDiaDoMes('');
                      if (nova !== 'semanal') setDiasSemana([]);
                    }}
                    className={`${campoSelect} w-32`}
                  >
                    <option value="diaria">dia(s)</option>
                    <option value="semanal">semana(s)</option>
                    <option value="mensal">mês(es)</option>
                    <option value="anual">ano(s)</option>
                  </select>
                </div>

                {frequencia === 'semanal' && (
                  <div className="flex gap-1">
                    {DIAS_SEMANA.map((letra, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => alternarDia(i)}
                        aria-pressed={diasSemana.includes(i)}
                        className={`h-8 w-8 rounded-full text-sm transition-colors ${
                          diasSemana.includes(i)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/70'
                        }`}
                      >
                        {letra}
                      </button>
                    ))}
                  </div>
                )}

                {frequencia === 'mensal' && (
                  <div className="space-y-2">
                    <Label htmlFor="dia_do_mes">Vence todo dia</Label>
                    <Input
                      id="dia_do_mes"
                      name="dia_do_mes"
                      type="number"
                      min={1}
                      max={31}
                      value={diaDoMes}
                      onChange={(e) => setDiaDoMes(e.target.value)}
                      placeholder="15"
                      className="w-24"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="inicio">Começa em</Label>
                  <Input
                    id="inicio"
                    name="inicio"
                    type="date"
                    required
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm">Termina</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={fimTipo === 'nunca'}
                      onChange={() => setFimTipo('nunca')}
                    />
                    Nunca
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={fimTipo === 'data'}
                      onChange={() => setFimTipo('data')}
                    />
                    Em
                    <Input
                      name="fim_data"
                      type="date"
                      value={fimData}
                      onChange={(e) => {
                        setFimData(e.target.value);
                        setFimTipo('data');
                      }}
                      className="h-8 w-40"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={fimTipo === 'ocorrencias'}
                      onChange={() => setFimTipo('ocorrencias')}
                    />
                    Após
                    <Input
                      name="fim_ocorrencias"
                      type="number"
                      min={1}
                      value={fimOcorrencias}
                      onChange={(e) => {
                        setFimOcorrencias(e.target.value);
                        setFimTipo('ocorrencias');
                      }}
                      className="h-8 w-20"
                    />
                    vezes
                  </label>
                </div>
              </div>

              {/* prévia */}
              {previa && previa.length > 0 && (
                <div className="rounded-md bg-muted/50 p-3 text-sm">
                  <p className="font-medium">{resumo}</p>
                  <p className="mt-1 text-muted-foreground">
                    {previa.length} ocorrência(s) · primeira em{' '}
                    {previa[0].split('-').reverse().join('/')} · última em{' '}
                    {previa[previa.length - 1].split('-').reverse().join('/')}
                  </p>
                </div>
              )}
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
