import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Save, Trash2, AlertTriangle, CheckCircle, Wallet, TrendingUp } from 'lucide-react';
import { Area, Category } from '@/types/finance';
import { BudgetWithSpent } from '@/hooks/useBudgets';
import { toast } from 'sonner';

interface BudgetsSettingsTabProps {
  areas: Area[];
  categories: Category[];
  getBudgetForCategory: (categoryId: string) => number | null;
  onSaveBudget: (categoryId: string, amount: number) => void;
  onDeleteBudget: (categoryId: string) => void;
  onCopyFromPreviousMonth: () => void;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  budgetsWithSpent: BudgetWithSpent[];
  summary: {
    totalBudgeted: number;
    totalSpent: number;
    percentUsed: number;
    overBudgetCount: number;
    withinBudgetCount: number;
    totalCategories: number;
  };
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
  if (percent >= 91) return 'bg-chart-3';
  if (percent >= 71) return 'bg-chart-4';
  return 'bg-chart-2';
};

const getStatusIcon = (percent: number) => {
  if (percent >= 100) return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (percent >= 70) return <AlertTriangle className="h-4 w-4 text-chart-4" />;
  return <CheckCircle className="h-4 w-4 text-chart-2" />;
};

export function BudgetsSettingsTab({
  areas,
  categories,
  getBudgetForCategory,
  onSaveBudget,
  onDeleteBudget,
  onCopyFromPreviousMonth,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  budgetsWithSpent,
  summary,
}: BudgetsSettingsTabProps) {
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const years = [2024, 2025, 2026, 2027];

  // Create a map of spent amounts by category for quick lookup
  const spentByCategory = useMemo(() => {
    const map: Record<string, { spent: number; percent: number }> = {};
    budgetsWithSpent.forEach(b => {
      map[b.categoryId] = { spent: b.spentAmount, percent: b.percentUsed };
    });
    return map;
  }, [budgetsWithSpent]);

  const categoriesByArea = useMemo(() => {
    const grouped: Record<string, { area: Area; categories: Category[] }> = {};
    
    areas.forEach(area => {
      const areaCategories = categories.filter(c => c.areaId === area.id);
      if (areaCategories.length > 0) {
        grouped[area.id] = { area, categories: areaCategories };
      }
    });
    
    return grouped;
  }, [areas, categories]);

  const handleValueChange = (categoryId: string, value: string) => {
    setEditingValues(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSave = (categoryId: string) => {
    const value = editingValues[categoryId];
    if (!value || isNaN(parseFloat(value))) {
      toast.error('Insira um valor válido');
      return;
    }
    
    const amount = parseFloat(value.replace(',', '.'));
    if (amount < 0) {
      toast.error('O valor não pode ser negativo');
      return;
    }
    
    onSaveBudget(categoryId, amount);
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[categoryId];
      return newValues;
    });
  };

  const handleDelete = (categoryId: string) => {
    onDeleteBudget(categoryId);
  };

  const getDisplayValue = (categoryId: string): string => {
    if (editingValues[categoryId] !== undefined) {
      return editingValues[categoryId];
    }
    const budget = getBudgetForCategory(categoryId);
    return budget !== null ? budget.toString() : '';
  };

  const hasBudget = (categoryId: string): boolean => {
    return getBudgetForCategory(categoryId) !== null;
  };

  return (
    <div className="space-y-4">
      {/* Month/Year Selector */}
      <div className="flex flex-wrap items-center gap-4 border-2 p-4">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Mês/Ano:</Label>
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
        <Button 
          variant="outline" 
          onClick={onCopyFromPreviousMonth}
          className="gap-2 border-2"
        >
          <Copy className="h-4 w-4" />
          Copiar do mês anterior
        </Button>
      </div>

      {/* Summary Card */}
      {summary.totalCategories > 0 && (
        <Card className="border-2 bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5" />
              <h3 className="font-semibold">Resumo - {MONTHS[selectedMonth]} {selectedYear}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Orçado</p>
                <p className="text-lg font-bold">{formatCurrency(summary.totalBudgeted)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gasto</p>
                <p className={`text-lg font-bold ${summary.percentUsed >= 100 ? 'text-destructive' : ''}`}>
                  {formatCurrency(summary.totalSpent)} ({summary.percentUsed.toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-lg font-bold ${summary.totalBudgeted - summary.totalSpent >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {formatCurrency(summary.totalBudgeted - summary.totalSpent)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {summary.overBudgetCount > 0 ? (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {summary.overBudgetCount} excedido(s)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-chart-2/10 px-3 py-2 text-chart-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Tudo em dia!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories by Area */}
      <ScrollArea className="h-[350px]">
        <div className="space-y-4 pr-4">
          {Object.values(categoriesByArea).map(({ area, categories: areaCategories }) => (
            <div key={area.id} className="border-2 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="h-4 w-4 rounded-full border" 
                  style={{ backgroundColor: area.color }} 
                />
                <h4 className="font-semibold">{area.name}</h4>
              </div>
              
              <div className="space-y-3">
                {areaCategories.map(category => {
                  const currentBudget = getBudgetForCategory(category.id);
                  const hasEdits = editingValues[category.id] !== undefined;
                  const spentInfo = spentByCategory[category.id];
                  const hasBudgetDefined = hasBudget(category.id);
                  
                  return (
                    <div key={category.id} className="flex flex-col gap-2 pl-6 pb-3 border-b border-border/50 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">└─</span>
                        <span className="min-w-[140px] font-medium">{category.name}</span>
                        
                        <div className="flex flex-1 items-center gap-2">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <Input
                            type="text"
                            placeholder="0,00"
                            value={getDisplayValue(category.id)}
                            onChange={(e) => handleValueChange(category.id, e.target.value)}
                            className="w-[120px] border-2"
                          />
                          
                          {(hasEdits || !hasBudgetDefined) && (
                            <Button
                              size="sm"
                              onClick={() => handleSave(category.id)}
                              className="gap-1 border-2"
                              disabled={!getDisplayValue(category.id)}
                            >
                              <Save className="h-3 w-3" />
                              Salvar
                            </Button>
                          )}
                          
                          {hasBudgetDefined && !hasEdits && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {!hasBudgetDefined && !hasEdits && (
                            <span className="text-sm text-muted-foreground italic">
                              Não definido
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar and spending info - only show if budget is defined */}
                      {hasBudgetDefined && spentInfo && (
                        <div className="ml-8 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(spentInfo.percent)}
                              <span className="text-muted-foreground">
                                Gasto: <span className={`font-medium ${spentInfo.percent >= 100 ? 'text-destructive' : ''}`}>
                                  {formatCurrency(spentInfo.spent)}
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  ({spentInfo.percent.toFixed(0)}%)
                                </span>
                              </span>
                            </div>
                            <span className={`font-medium ${spentInfo.percent >= 100 ? 'text-destructive' : 'text-chart-2'}`}>
                              {spentInfo.percent >= 100 ? 'Excedeu: ' : 'Restante: '}
                              {formatCurrency(Math.abs(currentBudget! - spentInfo.spent))}
                            </span>
                          </div>
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div 
                              className={`h-full transition-all ${getProgressColor(spentInfo.percent)}`}
                              style={{ width: `${Math.min(spentInfo.percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Show zero spending if budget defined but no spending yet */}
                      {hasBudgetDefined && !spentInfo && (
                        <div className="ml-8 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-chart-2" />
                              <span className="text-muted-foreground">
                                Gasto: <span className="font-medium">R$ 0,00</span>
                                <span className="text-muted-foreground ml-1">(0%)</span>
                              </span>
                            </div>
                            <span className="font-medium text-chart-2">
                              Restante: {formatCurrency(currentBudget!)}
                            </span>
                          </div>
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full w-0 bg-chart-2" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
