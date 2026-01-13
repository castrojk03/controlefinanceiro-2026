import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DailyBalance, Expense, Income, Area, Category } from '@/types/finance';
import { format, isSameDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil } from 'lucide-react';

interface DailyPanelProps {
  dailyBalances: DailyBalance[];
  selectedMonth: number;
  selectedYear: number;
  expenses?: Expense[];
  incomes?: Income[];
  areas?: Area[];
  categories?: Category[];
  onEditExpense?: (expense: Expense) => void;
  onEditIncome?: (income: Income) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatCurrency = (value: number) => {
  if (value === 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function DailyPanel({ 
  dailyBalances, 
  selectedMonth, 
  selectedYear,
  expenses = [],
  incomes = [],
  areas = [],
  categories = [],
  onEditExpense,
  onEditIncome
}: DailyPanelProps) {
  const totalIncome = dailyBalances.reduce((acc, d) => acc + d.income, 0);
  const totalExpense = dailyBalances.reduce((acc, d) => acc + d.expense, 0);
  const finalBalance = dailyBalances[dailyBalances.length - 1]?.balance ?? 0;

  const today = new Date();

  const getExpensesForDay = (date: Date) => {
    return expenses.filter(exp => {
      const expDate = exp.paymentDate ? new Date(exp.paymentDate) : new Date(exp.date);
      return isSameDay(expDate, date);
    });
  };

  const getIncomesForDay = (date: Date) => {
    return incomes.filter(inc => {
      const incDate = new Date(inc.date);
      return isSameDay(incDate, date);
    });
  };

  const getAreaName = (areaId: string) => areas.find(a => a.id === areaId)?.name || '';
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || '';

  const getExpenseOpacity = (expense: Expense) => {
    const expenseDate = new Date(expense.paymentDate || expense.date);
    const isOverdue = expense.status === 'scheduled' && (isBefore(expenseDate, today) || isSameDay(expenseDate, today));
    
    if (expense.status === 'paid') return 'opacity-100';
    if (isOverdue) return 'opacity-100';
    return 'opacity-50';
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="border-b-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl font-bold">Painel Diário</span>
          <span className="text-sm font-normal text-muted-foreground">
            • {MONTHS[selectedMonth]} {selectedYear}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="border-b-2 hover:bg-transparent">
                <TableHead className="w-[150px] border-r-2 font-bold">Data</TableHead>
                <TableHead className="w-[150px] border-r text-right font-bold text-chart-2">Entrada</TableHead>
                <TableHead className="w-[150px] border-r text-right font-bold text-destructive">Saída</TableHead>
                <TableHead className="w-[150px] border-r text-right font-bold">Saldo</TableHead>
                {(onEditExpense || onEditIncome) && <TableHead className="w-[250px] font-bold">Transações do Dia</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyBalances.map((day, index) => {
                const hasActivity = day.income > 0 || day.expense > 0;
                const dayExpenses = getExpensesForDay(day.date);
                const dayIncomes = getIncomesForDay(day.date);
                
                return (
                  <TableRow 
                    key={index} 
                    className={`border-b ${hasActivity ? 'bg-secondary/20' : ''} hover:bg-secondary/40`}
                  >
                    <TableCell className="border-r-2 font-medium">
                      <div className="flex flex-col">
                        <span>{format(day.date, 'dd/MM/yyyy')}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(day.date, 'EEEE', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`border-r text-right font-mono ${day.income > 0 ? 'text-chart-2' : 'text-muted-foreground'}`}>
                      {formatCurrency(day.income)}
                    </TableCell>
                    <TableCell className={`border-r text-right font-mono ${day.expense > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formatCurrency(day.expense)}
                    </TableCell>
                    <TableCell className={`border-r text-right font-mono font-medium ${day.balance >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                      {formatCurrency(day.balance)}
                    </TableCell>
                    {(onEditExpense || onEditIncome) && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {/* Incomes */}
                          {onEditIncome && dayIncomes.slice(0, 2).map(inc => (
                            <Button
                              key={inc.id}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs gap-1 text-chart-2 hover:text-chart-2"
                              onClick={() => onEditIncome(inc)}
                              title={`${inc.description} - ${inc.origin}`}
                            >
                              <Pencil className="h-3 w-3" />
                              {formatCurrency(inc.value)}
                            </Button>
                          ))}
                          {/* Expenses */}
                          {onEditExpense && dayExpenses.slice(0, 2).map(exp => (
                            <Button
                              key={exp.id}
                              variant="ghost"
                              size="sm"
                              className={`h-6 px-2 text-xs gap-1 text-destructive hover:text-destructive ${getExpenseOpacity(exp)}`}
                              onClick={() => onEditExpense(exp)}
                              title={`${exp.description} - ${getAreaName(exp.areaId)} / ${getCategoryName(exp.categoryId)}`}
                            >
                              <Pencil className="h-3 w-3" />
                              {formatCurrency(exp.value)}
                            </Button>
                          ))}
                          {(dayExpenses.length + dayIncomes.length) > 4 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{(dayExpenses.length + dayIncomes.length) - 4}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              
              {/* Total Row */}
              <TableRow className="border-t-2 bg-primary/5 font-bold hover:bg-primary/10">
                <TableCell className="border-r-2 font-bold">TOTAL</TableCell>
                <TableCell className="border-r text-right font-mono text-chart-2">
                  {formatCurrency(totalIncome)}
                </TableCell>
                <TableCell className="border-r text-right font-mono text-destructive">
                  {formatCurrency(totalExpense)}
                </TableCell>
                <TableCell className={`border-r text-right font-mono ${finalBalance >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {formatCurrency(finalBalance)}
                </TableCell>
                {(onEditExpense || onEditIncome) && <TableCell></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
