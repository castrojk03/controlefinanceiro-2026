import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Expense, Account, Card as CardType, Area, Category } from '@/types/finance';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths, isBefore, isAfter, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Maximize2, Minimize2, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseListPanelProps {
  expenses: Expense[];
  accounts: Account[];
  cards: CardType[];
  areas: Area[];
  categories: Category[];
  onEditExpense: (expense: Expense) => void;
}

type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const ITEMS_PER_PAGE = 20;

export function ExpenseListPanel({
  expenses,
  accounts,
  cards,
  areas,
  categories,
  onEditExpense,
}: ExpenseListPanelProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'date' | 'value' | 'description'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    
    switch (periodType) {
      case 'week':
        return { startDate: startOfWeek(now, { weekStartsOn: 0 }), endDate: endOfWeek(now, { weekStartsOn: 0 }) };
      case 'month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'quarter':
        return { startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now) };
      case 'year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'custom':
        return { 
          startDate: customStartDate ? new Date(customStartDate) : startOfMonth(now), 
          endDate: customEndDate ? new Date(customEndDate) : endOfMonth(now) 
        };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [periodType, customStartDate, customEndDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return (isAfter(expenseDate, startDate) || isSameDay(expenseDate, startDate)) && 
             (isBefore(expenseDate, endDate) || isSameDay(expenseDate, endDate));
    });
  }, [expenses, startDate, endDate]);

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'value') {
        comparison = a.value - b.value;
      } else if (sortField === 'description') {
        comparison = a.description.localeCompare(b.description);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredExpenses, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = sortedExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalValue = filteredExpenses.reduce((acc, exp) => acc + exp.value, 0);

  const handleSort = (field: 'date' | 'value' | 'description') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getAreaName = (areaId: string) => areas.find(a => a.id === areaId)?.name || '-';
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || '-';
  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || '-';
  const getCardName = (cardId?: string) => cardId ? cards.find(c => c.id === cardId)?.name || '-' : '-';

  const getStatusBadge = (expense: Expense) => {
    const today = new Date();
    const expenseDate = new Date(expense.paymentDate || expense.date);
    const isOverdue = expense.status === 'scheduled' && (isBefore(expenseDate, today) || isSameDay(expenseDate, today));

    if (expense.status === 'paid') {
      return <Badge className="bg-green-500/80 text-white">PAGO</Badge>;
    }
    if (isOverdue) {
      return <Badge className="bg-red-500 text-white">VENCIDA</Badge>;
    }
    return <Badge className="bg-yellow-500/80 text-white">AGENDADO</Badge>;
  };

  const getRowOpacity = (expense: Expense) => {
    const today = new Date();
    const expenseDate = new Date(expense.paymentDate || expense.date);
    const isOverdue = expense.status === 'scheduled' && (isBefore(expenseDate, today) || isSameDay(expenseDate, today));

    if (expense.status === 'paid') return 'opacity-100';
    if (isOverdue) return 'opacity-100';
    return 'opacity-60';
  };

  return (
    <Card className={cn(
      "border-2 shadow-sm transition-all",
      isFullscreen && "fixed inset-0 z-50 rounded-none"
    )}>
      <CardHeader className="border-b-2 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            <span className="text-xl font-bold">Lista de Despesas</span>
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={periodType} onValueChange={(v) => { setPeriodType(v as PeriodType); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px] border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {periodType === 'custom' && (
              <>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-[140px] border-2"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-[140px] border-2"
                />
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="border-2"
              title={isFullscreen ? "Sair de Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <span>
            Período: {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
          <span className="font-medium text-foreground">
            Total: {formatCurrency(totalValue)} ({filteredExpenses.length} despesas)
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className={cn("overflow-auto", isFullscreen ? "h-[calc(100vh-200px)]" : "max-h-[500px]")}>
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="border-b-2 hover:bg-transparent">
                <TableHead 
                  className="w-[100px] border-r cursor-pointer hover:bg-secondary/50"
                  onClick={() => handleSort('date')}
                >
                  Data {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="w-[200px] border-r cursor-pointer hover:bg-secondary/50"
                  onClick={() => handleSort('description')}
                >
                  Descrição {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="w-[100px] border-r">Área</TableHead>
                <TableHead className="w-[100px] border-r">Categoria</TableHead>
                <TableHead className="w-[80px] border-r">Tipo</TableHead>
                <TableHead 
                  className="w-[120px] border-r text-right cursor-pointer hover:bg-secondary/50"
                  onClick={() => handleSort('value')}
                >
                  Valor {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="w-[100px] border-r">Conta</TableHead>
                <TableHead className="w-[100px] border-r">Cartão</TableHead>
                <TableHead className="w-[100px] border-r">Status</TableHead>
                <TableHead className="w-[60px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhuma despesa encontrada no período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpenses.map((expense) => (
                  <TableRow 
                    key={expense.id} 
                    className={cn("border-b hover:bg-secondary/30", getRowOpacity(expense))}
                  >
                    <TableCell className="border-r font-mono text-sm">
                      {format(new Date(expense.date), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell className="border-r font-medium truncate max-w-[200px]" title={expense.description}>
                      {expense.description}
                      {expense.installmentNumber && expense.totalInstallments && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({expense.installmentNumber}/{expense.totalInstallments})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="border-r text-sm">{getAreaName(expense.areaId)}</TableCell>
                    <TableCell className="border-r text-sm">{getCategoryName(expense.categoryId)}</TableCell>
                    <TableCell className="border-r text-xs text-muted-foreground">{expense.type}</TableCell>
                    <TableCell className="border-r text-right font-mono text-destructive">
                      {formatCurrency(expense.value)}
                    </TableCell>
                    <TableCell className="border-r text-sm">{getAccountName(expense.accountId)}</TableCell>
                    <TableCell className="border-r text-sm">{getCardName(expense.cardId)}</TableCell>
                    <TableCell className="border-r">{getStatusBadge(expense)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditExpense(expense)}
                        title="Editar"
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t-2">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
