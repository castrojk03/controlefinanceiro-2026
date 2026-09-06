/**
 * Tipos de domínio do Controle Financeiro.
 *
 * Espelham o schema aplicado em 06/09/2026. Os nomes seguem o banco
 * (snake_case) para evitar uma camada de tradução que só existiria para
 * agradar a convenção do JavaScript.
 */

export type TipoLancamento = 'entrada' | 'saida';
export type StatusLancamento = 'previsto' | 'pendente' | 'pago';
export type OrigemLancamento = 'agente' | 'manual';
export type Responsavel = 'john' | 'amanda' | 'casal';
export type ClassificacaoArea = 'fixo' | 'prioridade' | 'estilo_vida';
export type StatusFatura = 'aberta' | 'fechada' | 'parcial' | 'paga';
export type TipoCartao = 'Crédito' | 'Débito';

export interface Conta {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  color: string;
  created_at: string;
}

export interface Cartao {
  id: string;
  user_id: string;
  name: string;
  type: TipoCartao;
  last_digits: string | null;
  color: string;
  account_id: string | null;
  credit_limit: number;
  due_day: number | null;
  closing_day: number | null;
  created_at: string;
}

export interface Area {
  id: string;
  user_id: string;
  name: string;
  color: string;
  classificacao: ClassificacaoArea | null;
  created_at: string;
}

export interface Categoria {
  id: string;
  user_id: string;
  name: string;
  area_id: string;
  created_at: string;
}

/** Cartão com o nome da conta vinculada, para exibição. */
export interface CartaoComConta extends Cartao {
  conta_nome: string | null;
}

/** Rótulos das classificações do método 50-35-15. */
export const ROTULO_CLASSIFICACAO: Record<ClassificacaoArea, string> = {
  fixo: 'Gastos fixos',
  prioridade: 'Prioridade financeira',
  estilo_vida: 'Estilo de vida',
};

/** Paleta usada ao criar contas e cartões. */
export const CORES = [
  '#3B6E8F',
  '#4E8F6E',
  '#8F5A5A',
  '#8F7A3B',
  '#6E5A8F',
  '#8F6E4E',
  '#8F4E7A',
  '#5A7A8F',
  '#7A4E4E',
  '#4E6E7A',
] as const;
