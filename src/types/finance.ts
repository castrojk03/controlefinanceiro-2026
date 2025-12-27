// Financial data types

export type TransactionType = 'Fixo' | 'Variável' | 'Sazonal';
export type PaymentMethod = 'Débito' | 'Crédito';

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
}

export interface Card {
  id: string;
  name: string;
  type: PaymentMethod;
  lastDigits: string;
  color: string;
  accountId: string;
}

export interface Area {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  areaId: string;
}

export interface Income {
  id: string;
  description: string;
  type: TransactionType;
  value: number;
  date: Date;
  origin: string;
  accountId: string;
}

export interface Expense {
  id: string;
  description: string;
  type: TransactionType;
  value: number;
  date: Date;
  accountId: string;
  cardId?: string;
  areaId: string;
  categoryId: string;
}

export interface DailyBalance {
  date: Date;
  income: number;
  expense: number;
  balance: number;
}

export interface MonthlyData {
  month: number;
  year: number;
  incomes: Income[];
  expenses: Expense[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
