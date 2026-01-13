import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Budget {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  budgetedAmount: number;
}

export interface BudgetWithSpent extends Budget {
  categoryName: string;
  areaName: string;
  areaColor: string;
  spentAmount: number;
  percentUsed: number;
}

interface UseBudgetsProps {
  month: number;
  year: number;
  expenses: Array<{
    categoryId: string;
    value: number;
    date: Date;
    status: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    areaId: string;
  }>;
  areas: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export function useBudgets({ month, year, expenses, categories, areas }: UseBudgetsProps) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Load budgets from database
  const loadBudgets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', month + 1) // DB uses 1-indexed months
        .eq('year', year);

      if (error) throw error;

      if (data) {
        setBudgets(data.map(b => ({
          id: b.id,
          categoryId: b.category_id,
          month: b.month - 1, // Convert back to 0-indexed
          year: b.year,
          budgetedAmount: Number(b.budgeted_amount),
        })));
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  }, [user, month, year]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Calculate spent amount per category for the current month
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (
        expenseDate.getMonth() === month &&
        expenseDate.getFullYear() === year &&
        expense.status === 'paid'
      ) {
        if (!spending[expense.categoryId]) {
          spending[expense.categoryId] = 0;
        }
        spending[expense.categoryId] += expense.value;
      }
    });
    
    return spending;
  }, [expenses, month, year]);

  // Budgets with spent amounts and category info
  const budgetsWithSpent = useMemo((): BudgetWithSpent[] => {
    return budgets.map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      const area = areas.find(a => a.id === category?.areaId);
      const spentAmount = categorySpending[budget.categoryId] || 0;
      const percentUsed = budget.budgetedAmount > 0 
        ? (spentAmount / budget.budgetedAmount) * 100 
        : 0;

      return {
        ...budget,
        categoryName: category?.name || 'Categoria não encontrada',
        areaName: area?.name || 'Área não encontrada',
        areaColor: area?.color || 'hsl(210, 80%, 55%)',
        spentAmount,
        percentUsed,
      };
    }).sort((a, b) => b.percentUsed - a.percentUsed);
  }, [budgets, categories, areas, categorySpending]);

  // Summary statistics
  const summary = useMemo(() => {
    const totalBudgeted = budgets.reduce((acc, b) => acc + b.budgetedAmount, 0);
    const totalSpent = budgetsWithSpent.reduce((acc, b) => acc + b.spentAmount, 0);
    const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    const overBudgetCount = budgetsWithSpent.filter(b => b.percentUsed >= 100).length;
    const withinBudgetCount = budgetsWithSpent.filter(b => b.percentUsed < 100).length;

    return {
      totalBudgeted,
      totalSpent,
      percentUsed,
      overBudgetCount,
      withinBudgetCount,
      totalCategories: budgetsWithSpent.length,
    };
  }, [budgets, budgetsWithSpent]);

  // Save or update a budget
  const saveBudget = useCallback(async (categoryId: string, amount: number) => {
    if (!user) return;

    try {
      const existingBudget = budgets.find(b => b.categoryId === categoryId);
      
      if (existingBudget) {
        // Update existing
        const { error } = await supabase
          .from('budgets')
          .update({ budgeted_amount: amount })
          .eq('id', existingBudget.id);

        if (error) throw error;

        setBudgets(prev => prev.map(b => 
          b.id === existingBudget.id 
            ? { ...b, budgetedAmount: amount }
            : b
        ));
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            month: month + 1, // DB uses 1-indexed months
            year: year,
            budgeted_amount: amount,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setBudgets(prev => [...prev, {
            id: data.id,
            categoryId: data.category_id,
            month: data.month - 1,
            year: data.year,
            budgetedAmount: Number(data.budgeted_amount),
          }]);
        }
      }

      toast.success('Orçamento salvo!');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Erro ao salvar orçamento');
    }
  }, [user, budgets, month, year]);

  // Delete a budget
  const deleteBudget = useCallback(async (categoryId: string) => {
    if (!user) return;

    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budget.id);

      if (error) throw error;

      setBudgets(prev => prev.filter(b => b.id !== budget.id));
      toast.success('Orçamento removido!');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Erro ao remover orçamento');
    }
  }, [user, budgets]);

  // Copy budgets from previous month
  const copyFromPreviousMonth = useCallback(async () => {
    if (!user) return;

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    try {
      // Fetch previous month budgets
      const { data: prevBudgets, error: fetchError } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', prevMonth + 1)
        .eq('year', prevYear);

      if (fetchError) throw fetchError;

      if (!prevBudgets || prevBudgets.length === 0) {
        toast.error('Nenhum orçamento encontrado no mês anterior');
        return;
      }

      // Filter out categories that already have budgets in current month
      const existingCategoryIds = budgets.map(b => b.categoryId);
      const budgetsToCopy = prevBudgets.filter(
        b => !existingCategoryIds.includes(b.category_id)
      );

      if (budgetsToCopy.length === 0) {
        toast.info('Todos os orçamentos já foram copiados');
        return;
      }

      // Insert new budgets
      const { data: newBudgets, error: insertError } = await supabase
        .from('budgets')
        .insert(
          budgetsToCopy.map(b => ({
            user_id: user.id,
            category_id: b.category_id,
            month: month + 1,
            year: year,
            budgeted_amount: b.budgeted_amount,
          }))
        )
        .select();

      if (insertError) throw insertError;

      if (newBudgets) {
        setBudgets(prev => [
          ...prev,
          ...newBudgets.map(b => ({
            id: b.id,
            categoryId: b.category_id,
            month: b.month - 1,
            year: b.year,
            budgetedAmount: Number(b.budgeted_amount),
          })),
        ]);
        toast.success(`${newBudgets.length} orçamento(s) copiado(s)!`);
      }
    } catch (error) {
      console.error('Error copying budgets:', error);
      toast.error('Erro ao copiar orçamentos');
    }
  }, [user, month, year, budgets]);

  // Get budget for a specific category
  const getBudgetForCategory = useCallback((categoryId: string): number | null => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    return budget?.budgetedAmount ?? null;
  }, [budgets]);

  return {
    budgets,
    budgetsWithSpent,
    summary,
    loading,
    saveBudget,
    deleteBudget,
    copyFromPreviousMonth,
    getBudgetForCategory,
    reload: loadBudgets,
  };
}
