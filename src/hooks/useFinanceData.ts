import { useState, useMemo, useCallback } from 'react';
import { Account, Card, Area, Category, Income, Expense, DailyBalance } from '@/types/finance';
import { initialAreas, initialCategories } from '@/lib/mockData';

export function useFinanceData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getMonth() === selectedMonth && incomeDate.getFullYear() === selectedYear;
    });
  }, [incomes, selectedMonth, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const previousMonthIncomes = useMemo(() => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    return incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getMonth() === prevMonth && incomeDate.getFullYear() === prevYear;
    });
  }, [incomes, selectedMonth, selectedYear]);

  const previousMonthExpenses = useMemo(() => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const totalIncome = useMemo(() => {
    return filteredIncomes.reduce((acc, income) => acc + income.value, 0);
  }, [filteredIncomes]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => acc + expense.value, 0);
  }, [filteredExpenses]);

  const previousTotalIncome = useMemo(() => {
    return previousMonthIncomes.reduce((acc, income) => acc + income.value, 0);
  }, [previousMonthIncomes]);

  const previousTotalExpense = useMemo(() => {
    return previousMonthExpenses.reduce((acc, expense) => acc + expense.value, 0);
  }, [previousMonthExpenses]);

  const balance = totalIncome - totalExpense;
  const previousBalance = previousTotalIncome - previousTotalExpense;

  const dailyBalances = useMemo((): DailyBalance[] => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const balances: DailyBalance[] = [];
    let runningBalance = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayIncomes = filteredIncomes.filter(i => new Date(i.date).getDate() === day);
      const dayExpenses = filteredExpenses.filter(e => new Date(e.date).getDate() === day);
      
      const dayIncome = dayIncomes.reduce((acc, i) => acc + i.value, 0);
      const dayExpense = dayExpenses.reduce((acc, e) => acc + e.value, 0);
      runningBalance += dayIncome - dayExpense;

      balances.push({
        date: new Date(selectedYear, selectedMonth, day),
        income: dayIncome,
        expense: dayExpense,
        balance: runningBalance,
      });
    }

    return balances;
  }, [filteredIncomes, filteredExpenses, selectedMonth, selectedYear]);

  const incomesByOrigin = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    
    incomes.forEach(income => {
      const month = new Date(income.date).getMonth();
      const year = new Date(income.date).getFullYear();
      
      if (year === selectedYear) {
        if (!grouped[income.origin]) {
          grouped[income.origin] = Array(12).fill(0);
        }
        grouped[income.origin][month] += income.value;
      }
    });

    return grouped;
  }, [incomes, selectedYear]);

  const expensesByArea = useMemo(() => {
    const grouped: Record<string, { total: number[]; categories: Record<string, number[]> }> = {};
    
    expenses.forEach(expense => {
      const month = new Date(expense.date).getMonth();
      const year = new Date(expense.date).getFullYear();
      
      if (year === selectedYear) {
        const area = areas.find(a => a.id === expense.areaId);
        const category = categories.find(c => c.id === expense.categoryId);
        
        if (area && category) {
          if (!grouped[area.name]) {
            grouped[area.name] = { total: Array(12).fill(0), categories: {} };
          }
          if (!grouped[area.name].categories[category.name]) {
            grouped[area.name].categories[category.name] = Array(12).fill(0);
          }
          
          grouped[area.name].total[month] += expense.value;
          grouped[area.name].categories[category.name][month] += expense.value;
        }
      }
    });

    return grouped;
  }, [expenses, areas, categories, selectedYear]);

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome: Income = {
      ...income,
      id: Date.now().toString(),
    };
    setIncomes([...incomes, newIncome]);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses([...expenses, newExpense]);
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
    };
    setAccounts([...accounts, newAccount]);
  };

  const addCard = (card: Omit<Card, 'id'>) => {
    const newCard: Card = {
      ...card,
      id: Date.now().toString(),
    };
    setCards([...cards, newCard]);
  };

  const addArea = (area: Omit<Area, 'id'>) => {
    const newArea: Area = {
      ...area,
      id: Date.now().toString(),
    };
    setAreas([...areas, newArea]);
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    setCategories([...categories, newCategory]);
  };

  const clearAllData = useCallback(() => {
    setAccounts([]);
    setCards([]);
    setAreas([]);
    setCategories([]);
    setIncomes([]);
    setExpenses([]);
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  }, []);

  const deleteArea = useCallback((id: string) => {
    setAreas((prev) => prev.filter((area) => area.id !== id));
    setCategories((prev) => prev.filter((category) => category.areaId !== id));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }, []);

  return {
    accounts,
    cards,
    areas,
    categories,
    incomes: filteredIncomes,
    expenses: filteredExpenses,
    allIncomes: incomes,
    allExpenses: expenses,
    totalIncome,
    totalExpense,
    previousTotalIncome,
    previousTotalExpense,
    balance,
    previousBalance,
    dailyBalances,
    incomesByOrigin,
    expensesByArea,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    addIncome,
    addExpense,
    addAccount,
    addCard,
    addArea,
    addCategory,
    clearAllData,
    deleteAccount,
    deleteCard,
    deleteArea,
    deleteCategory,
  };
}
