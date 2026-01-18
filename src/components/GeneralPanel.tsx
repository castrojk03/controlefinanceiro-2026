import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, ChevronDown, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Account, Card as CardType, Area, Category, Income, Expense, TransactionType, ExpenseStatus, RecurrenceConfig } from '@/types/finance';
import { AddTransactionForm } from '@/components/AddTransactionForm';

interface GeneralPanelProps {
  incomesByOrigin: Record<string, number[]>;
  expensesByArea: Record<string, { total: number[]; categories: Record<string, number[]> }>;
  selectedYear: number;
  allIncomes?: Income[];
  allExpenses?: Expense[];
  areas?: Area[];
  categories?: Category[];
  accounts?: Account[];
  cards?: CardType[];
  onAddIncome?: (income: {
    description: string;
    type: TransactionType;
    value: number;
    date: Date;
    origin: string;
    accountId: string;
  }) => void;
  onAddExpense?: (expense: {
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
  }) => void;
  onEditIncome?: (income: Income) => void;
  onEditExpense?: (expense: Expense) => void;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (value: number) => {
  if (value === 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function GeneralPanel({ 
  incomesByOrigin, 
  expensesByArea, 
  selectedYear,
  allIncomes = [],
  allExpenses = [],
  areas = [],
  categories = [],
  accounts = [],
  cards = [],
  onAddIncome,
  onAddExpense,
  onEditIncome,
  onEditExpense,
}: GeneralPanelProps) {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogTab, setAddDialogTab] = useState<'income' | 'expense'>('expense');

  const toggleArea = (area: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(area)) {
      newExpanded.delete(area);
    } else {
      newExpanded.add(area);
    }
    setExpandedAreas(newExpanded);
  };

  const monthlyTotals = useMemo(() => {
    const incomes = Array(12).fill(0);
    const expenses = Array(12).fill(0);

    Object.values(incomesByOrigin).forEach(values => {
      values.forEach((value, index) => {
        incomes[index] += value;
      });
    });

    Object.values(expensesByArea).forEach(area => {
      area.total.forEach((value, index) => {
        expenses[index] += value;
      });
    });

    return { incomes, expenses };
  }, [incomesByOrigin, expensesByArea]);

  const totalIncome = monthlyTotals.incomes.reduce((a, b) => a + b, 0);
  const totalExpense = monthlyTotals.expenses.reduce((a, b) => a + b, 0);

  // Handle clicking on income origin row
  const handleIncomeOriginClick = (origin: string, monthIndex: number) => {
    if (!onEditIncome) return;
    
    // Find incomes matching this origin and month
    const matchingIncomes = allIncomes.filter(income => {
      const incomeDate = new Date(income.date);
      return income.origin === origin && 
             incomeDate.getMonth() === monthIndex && 
             incomeDate.getFullYear() === selectedYear;
    });

    // Open the first matching income for editing
    if (matchingIncomes.length > 0) {
      onEditIncome(matchingIncomes[0]);
    }
  };

  // Handle clicking on expense category row
  const handleExpenseCategoryClick = (areaName: string, categoryName: string, monthIndex: number) => {
    if (!onEditExpense) return;
    
    const area = areas.find(a => a.name === areaName);
    const category = categories.find(c => c.name === categoryName && c.areaId === area?.id);
    
    if (!category) return;

    // Find expenses matching this category and month
    const matchingExpenses = allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expense.categoryId === category.id && 
             expenseDate.getMonth() === monthIndex && 
             expenseDate.getFullYear() === selectedYear;
    });

    // Open the first matching expense for editing
    if (matchingExpenses.length > 0) {
      onEditExpense(matchingExpenses[0]);
    }
  };

  // Handle clicking on area total row
  const handleAreaClick = (areaName: string, monthIndex: number) => {
    if (!onEditExpense) return;
    
    const area = areas.find(a => a.name === areaName);
    if (!area) return;

    // Find expenses matching this area and month
    const matchingExpenses = allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expense.areaId === area.id && 
             expenseDate.getMonth() === monthIndex && 
             expenseDate.getFullYear() === selectedYear;
    });

    // Open the first matching expense for editing
    if (matchingExpenses.length > 0) {
      onEditExpense(matchingExpenses[0]);
    }
  };

  const handleAddIncome = (income: Parameters<NonNullable<typeof onAddIncome>>[0]) => {
    onAddIncome?.(income);
    setAddDialogOpen(false);
  };

  const handleAddExpense = (expense: Parameters<NonNullable<typeof onAddExpense>>[0]) => {
    onAddExpense?.(expense);
    setAddDialogOpen(false);
  };

  return (
    <Card className="border-2 shadow-sm relative">
      <CardHeader className="border-b-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl font-bold">Painel Geral</span>
          <span className="text-sm font-normal text-muted-foreground">• {selectedYear}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 hover:bg-transparent">
                <TableHead className="w-[200px] border-r-2 font-bold">Descrição</TableHead>
                <TableHead className="w-[80px] border-r font-bold">Tipo</TableHead>
                {MONTHS_SHORT.map((month) => (
                  <TableHead key={month} className="w-[80px] border-r text-center font-bold">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="w-[100px] text-center font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* RECEITAS */}
              <TableRow className="border-b-2 bg-chart-2/10 hover:bg-chart-2/20">
                <TableCell colSpan={15} className="font-bold text-chart-2">
                  RECEITAS
                </TableCell>
              </TableRow>
              
              {Object.entries(incomesByOrigin).map(([origin, values]) => (
                <TableRow key={origin} className="border-b hover:bg-secondary/50">
                  <TableCell className="border-r-2 font-medium">{origin}</TableCell>
                  <TableCell className="border-r text-xs text-muted-foreground">Variável</TableCell>
                  {values.map((value, index) => (
                    <TableCell 
                      key={index} 
                      className={`border-r text-center font-mono text-sm ${value > 0 && onEditIncome ? 'cursor-pointer hover:bg-chart-2/20' : ''}`}
                      onClick={() => value > 0 && handleIncomeOriginClick(origin, index)}
                    >
                      {formatCurrency(value)}
                    </TableCell>
                  ))}
                  <TableCell className="bg-secondary/30 text-center font-mono font-bold">
                    {formatCurrency(values.reduce((a, b) => a + b, 0))}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="border-b-2 bg-chart-2/5 hover:bg-chart-2/10">
                <TableCell className="border-r-2 font-bold">Total Receitas</TableCell>
                <TableCell className="border-r"></TableCell>
                {monthlyTotals.incomes.map((value, index) => (
                  <TableCell key={index} className="border-r text-center font-mono font-bold text-chart-2">
                    {formatCurrency(value)}
                  </TableCell>
                ))}
                <TableCell className="bg-chart-2/20 text-center font-mono font-bold text-chart-2">
                  {formatCurrency(totalIncome)}
                </TableCell>
              </TableRow>

              {/* DESPESAS */}
              <TableRow className="border-b-2 bg-destructive/10 hover:bg-destructive/20">
                <TableCell colSpan={15} className="font-bold text-destructive">
                  DESPESAS
                </TableCell>
              </TableRow>

              {Object.entries(expensesByArea).map(([area, data]) => (
                <>
                  <TableRow 
                    key={area} 
                    className="border-b bg-secondary/30 hover:bg-secondary/50"
                  >
                    <TableCell className="border-r-2 font-bold">
                      <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={(e) => toggleArea(area, e)}
                      >
                        {expandedAreas.has(area) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {area}
                      </div>
                    </TableCell>
                    <TableCell className="border-r"></TableCell>
                    {data.total.map((value, index) => (
                      <TableCell 
                        key={index} 
                        className={`border-r text-center font-mono text-sm font-medium ${value > 0 && onEditExpense ? 'cursor-pointer hover:bg-destructive/20' : ''}`}
                        onClick={() => value > 0 && handleAreaClick(area, index)}
                      >
                        {formatCurrency(value)}
                      </TableCell>
                    ))}
                    <TableCell className="bg-secondary/50 text-center font-mono font-bold">
                      {formatCurrency(data.total.reduce((a, b) => a + b, 0))}
                    </TableCell>
                  </TableRow>

                  {expandedAreas.has(area) && Object.entries(data.categories).map(([category, values]) => (
                    <TableRow key={`${area}-${category}`} className="border-b hover:bg-secondary/30">
                      <TableCell className="border-r-2 pl-8 text-muted-foreground">{category}</TableCell>
                      <TableCell className="border-r text-xs text-muted-foreground">-</TableCell>
                      {values.map((value, index) => (
                        <TableCell 
                          key={index} 
                          className={`border-r text-center font-mono text-sm text-muted-foreground ${value > 0 && onEditExpense ? 'cursor-pointer hover:bg-destructive/20' : ''}`}
                          onClick={() => value > 0 && handleExpenseCategoryClick(area, category, index)}
                        >
                          {formatCurrency(value)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-mono text-sm text-muted-foreground">
                        {formatCurrency(values.reduce((a, b) => a + b, 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}

              <TableRow className="border-b-2 bg-destructive/5 hover:bg-destructive/10">
                <TableCell className="border-r-2 font-bold">Total Despesas</TableCell>
                <TableCell className="border-r"></TableCell>
                {monthlyTotals.expenses.map((value, index) => (
                  <TableCell key={index} className="border-r text-center font-mono font-bold text-destructive">
                    {formatCurrency(value)}
                  </TableCell>
                ))}
                <TableCell className="bg-destructive/20 text-center font-mono font-bold text-destructive">
                  {formatCurrency(totalExpense)}
                </TableCell>
              </TableRow>

              {/* SALDO */}
              <TableRow className="border-b-2 bg-primary/5 hover:bg-primary/10">
                <TableCell className="border-r-2 font-bold">SALDO</TableCell>
                <TableCell className="border-r"></TableCell>
                {monthlyTotals.incomes.map((income, index) => {
                  const balance = income - monthlyTotals.expenses[index];
                  return (
                    <TableCell 
                      key={index} 
                      className={`border-r text-center font-mono font-bold ${balance >= 0 ? 'text-chart-2' : 'text-destructive'}`}
                    >
                      {formatCurrency(balance)}
                    </TableCell>
                  );
                })}
                <TableCell className={`bg-primary/10 text-center font-mono font-bold ${totalIncome - totalExpense >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {formatCurrency(totalIncome - totalExpense)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Floating Add Button */}
      {onAddIncome && onAddExpense && (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Adicionar Transação</DialogTitle>
            </DialogHeader>

            <Tabs value={addDialogTab} onValueChange={(v) => setAddDialogTab(v as 'income' | 'expense')}>
              <TabsList className="grid w-full grid-cols-2 border-2">
                <TabsTrigger value="income" className="gap-2 data-[state=active]:bg-chart-2 data-[state=active]:text-primary-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Receita
                </TabsTrigger>
                <TabsTrigger value="expense" className="gap-2 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                  <TrendingDown className="h-4 w-4" />
                  Despesa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="mt-4">
                <AddTransactionForm
                  type="income"
                  accounts={accounts}
                  cards={cards}
                  areas={areas}
                  categories={categories}
                  onAddIncome={handleAddIncome}
                  onAddExpense={handleAddExpense}
                />
              </TabsContent>

              <TabsContent value="expense" className="mt-4">
                <AddTransactionForm
                  type="expense"
                  accounts={accounts}
                  cards={cards}
                  areas={areas}
                  categories={categories}
                  onAddIncome={handleAddIncome}
                  onAddExpense={handleAddExpense}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}