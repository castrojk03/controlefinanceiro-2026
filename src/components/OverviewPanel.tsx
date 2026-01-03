import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card as CardType, Account } from '@/types/finance';

interface OverviewPanelProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  previousTotalIncome: number;
  previousTotalExpense: number;
  previousBalance: number;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  cards: CardType[];
  accounts: Account[];
  getCardUsedLimit: (cardId: string) => number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export function OverviewPanel({
  totalIncome,
  totalExpense,
  balance,
  previousTotalIncome,
  previousTotalExpense,
  previousBalance,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  cards,
  accounts,
  getCardUsedLimit,
}: OverviewPanelProps) {
  const incomeChange = calculatePercentageChange(totalIncome, previousTotalIncome);
  const expenseChange = calculatePercentageChange(totalExpense, previousTotalExpense);
  const balanceChange = calculatePercentageChange(balance, previousBalance);

  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground">Resumo financeiro do período selecionado</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => onMonthChange(parseInt(v))}>
            <SelectTrigger className="w-[140px] border-2">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
            <SelectTrigger className="w-[100px] border-2">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center border-2 bg-secondary">
                <TrendingUp className="h-6 w-6 text-chart-2" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${incomeChange >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {incomeChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(incomeChange).toFixed(1)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Receitas</p>
              <p className="text-2xl font-bold text-chart-2">{formatCurrency(totalIncome)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                vs. {formatCurrency(previousTotalIncome)} mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center border-2 bg-secondary">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${expenseChange <= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {expenseChange <= 0 ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                {Math.abs(expenseChange).toFixed(1)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Despesas</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                vs. {formatCurrency(previousTotalExpense)} mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center border-2 bg-secondary">
                <Wallet className="h-6 w-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${balanceChange >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {balanceChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(balanceChange).toFixed(1)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Saldo do Mês</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {formatCurrency(balance)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                vs. {formatCurrency(previousBalance)} mês anterior
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards Section */}
      {cards.filter(c => c.type === 'Crédito').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cartões</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.filter(c => c.type === 'Crédito').map(card => {
              const usedLimit = getCardUsedLimit(card.id);
              const availableLimit = card.creditLimit - usedLimit;
              const account = accounts.find(a => a.id === card.accountId);

              return (
                <Card key={card.id} className="border-2 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-6 w-6" style={{ color: card.color }} />
                      <div>
                        <p className="font-semibold">{card.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Venc. dia {card.dueDay} | Fecha dia {card.closingDay}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Limite</span>
                        <span className="font-medium">{formatCurrency(card.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Utilizado</span>
                        <span className="font-medium text-destructive">{formatCurrency(usedLimit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Disponível</span>
                        <span className="font-medium text-chart-2">{formatCurrency(availableLimit)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
