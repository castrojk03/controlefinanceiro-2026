import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, TrendingUp, Wallet } from 'lucide-react';
import { BudgetWithSpent } from '@/hooks/useBudgets';

interface BudgetPanelProps {
  budgets: BudgetWithSpent[];
  summary: {
    totalBudgeted: number;
    totalSpent: number;
    percentUsed: number;
    overBudgetCount: number;
    withinBudgetCount: number;
    totalCategories: number;
  };
  selectedMonth: number;
  selectedYear: number;
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

const getProgressColor = (percent: number): string => {
  if (percent >= 100) return 'bg-destructive';
  if (percent >= 91) return 'bg-orange-500';
  if (percent >= 71) return 'bg-yellow-500';
  return 'bg-chart-2';
};

const getStatusIcon = (percent: number) => {
  if (percent >= 100) return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (percent >= 90) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  return <CheckCircle className="h-4 w-4 text-chart-2" />;
};

export function BudgetPanel({ budgets, summary, selectedMonth, selectedYear }: BudgetPanelProps) {
  if (budgets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            Orçamentos do Mês - {MONTHS[selectedMonth]} {selectedYear}
          </h3>
        </div>
        <div className="text-sm text-muted-foreground">
          {summary.withinBudgetCount} de {summary.totalCategories} dentro do orçamento
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-2">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Orçado</p>
              <p className="text-xl font-bold">{formatCurrency(summary.totalBudgeted)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className={`text-xl font-bold ${summary.percentUsed >= 100 ? 'text-destructive' : ''}`}>
                {formatCurrency(summary.totalSpent)} ({summary.percentUsed.toFixed(0)}%)
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponível</p>
              <p className={`text-xl font-bold ${summary.totalBudgeted - summary.totalSpent >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {formatCurrency(summary.totalBudgeted - summary.totalSpent)}
              </p>
            </div>
            {summary.overBudgetCount > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {summary.overBudgetCount} categoria(s) ultrapassou
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </div>
    </div>
  );
}

interface BudgetCardProps {
  budget: BudgetWithSpent;
}

function BudgetCard({ budget }: BudgetCardProps) {
  const remaining = budget.budgetedAmount - budget.spentAmount;
  const isOverBudget = budget.percentUsed >= 100;
  const progressValue = Math.min(budget.percentUsed, 100);

  return (
    <Card className="border-2 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: budget.areaColor }}
            />
            <CardTitle className="text-base font-medium">
              {budget.categoryName}
            </CardTitle>
          </div>
          {getStatusIcon(budget.percentUsed)}
        </div>
        <p className="text-xs text-muted-foreground">{budget.areaName}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Orçado:</span>
          <span className="font-medium">{formatCurrency(budget.budgetedAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gasto:</span>
          <span className={`font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
            {formatCurrency(budget.spentAmount)} ({budget.percentUsed.toFixed(0)}%)
          </span>
        </div>
        
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div 
            className={`h-full transition-all ${getProgressColor(budget.percentUsed)}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {isOverBudget ? 'Ultrapassou:' : 'Faltam:'}
          </span>
          <span className={`font-medium ${isOverBudget ? 'text-destructive' : 'text-chart-2'}`}>
            {isOverBudget ? formatCurrency(Math.abs(remaining)) : formatCurrency(remaining)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
