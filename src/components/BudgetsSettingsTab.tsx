import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Save, Trash2 } from 'lucide-react';
import { Area, Category } from '@/types/finance';
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
}: BudgetsSettingsTabProps) {
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const years = [2024, 2025, 2026, 2027];

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
                  
                  return (
                    <div key={category.id} className="flex items-center gap-3 pl-6">
                      <span className="text-muted-foreground">└─</span>
                      <span className="min-w-[120px] font-medium">{category.name}</span>
                      
                      <div className="flex flex-1 items-center gap-2">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <Input
                          type="text"
                          placeholder="0,00"
                          value={getDisplayValue(category.id)}
                          onChange={(e) => handleValueChange(category.id, e.target.value)}
                          className="w-[120px] border-2"
                        />
                        
                        {(hasEdits || !hasBudget(category.id)) && (
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
                        
                        {hasBudget(category.id) && !hasEdits && (
                          <>
                            <span className="text-sm text-chart-2">
                              {formatCurrency(currentBudget!)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {!hasBudget(category.id) && !hasEdits && (
                          <span className="text-sm text-muted-foreground italic">
                            Não definido
                          </span>
                        )}
                      </div>
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
