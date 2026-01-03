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
  creditLimit: number;
  dueDay: number;
  closingDay: number;
}

export type InvoiceStatus = 'open' | 'closed' | 'paid';

export interface Invoice {
  id: string;
  cardId: string;
  month: number;
  year: number;
  status: InvoiceStatus;
  totalAmount: number;
  paidDate?: Date;
  paidFromAccountId?: string;
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

export type ExpenseStatus = 'paid' | 'scheduled';
export type RecurrenceType = 'none' | 'date_range' | 'installments' | 'frequency';
export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceConfig {
  type: RecurrenceType;
  startDate?: Date;
  endDate?: Date;
  installments?: number;
  frequency?: RecurrenceFrequency;
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
  status: ExpenseStatus;
  paymentDate?: Date;
  recurrence?: RecurrenceConfig;
  parentId?: string; // Para parcelas geradas de despesas recorrentes
  installmentNumber?: number; // Número da parcela
  totalInstallments?: number; // Total de parcelas
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
