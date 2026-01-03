import { useState, useMemo, useCallback } from 'react';
import { Account, Card, Area, Category, Income, Expense, DailyBalance, RecurrenceConfig, Invoice, InvoiceStatus } from '@/types/finance';
import { initialAreas, initialCategories } from '@/lib/mockData';
import { addMonths, addWeeks, addYears, differenceInMonths, isSameMonth, isSameYear } from 'date-fns';

// Helper function to generate recurring expense instances
function generateRecurringInstances(expense: Expense): Expense[] {
  if (!expense.recurrence || expense.recurrence.type === 'none') {
    return [expense];
  }

  const instances: Expense[] = [];
  const { type, startDate, endDate, installments, frequency } = expense.recurrence;
  const baseDate = startDate || expense.date;

  if (type === 'date_range' && endDate) {
    const monthsDiff = differenceInMonths(endDate, baseDate);
    for (let i = 0; i <= monthsDiff; i++) {
      const instanceDate = addMonths(new Date(baseDate), i);
      instances.push({
        ...expense,
        id: `${expense.id}_${i + 1}`,
        date: instanceDate,
        parentId: expense.id,
        installmentNumber: i + 1,
        totalInstallments: monthsDiff + 1,
      });
    }
  } else if (type === 'installments' && installments) {
    for (let i = 0; i < installments; i++) {
      const instanceDate = addMonths(new Date(baseDate), i);
      instances.push({
        ...expense,
        id: `${expense.id}_${i + 1}`,
        date: instanceDate,
        parentId: expense.id,
        installmentNumber: i + 1,
        totalInstallments: installments,
      });
    }
  } else if (type === 'frequency' && frequency) {
    // Generate instances for the next 12 periods for frequency-based recurrence
    const periodsToGenerate = 12;
    for (let i = 0; i < periodsToGenerate; i++) {
      let instanceDate: Date;
      switch (frequency) {
        case 'weekly':
          instanceDate = addWeeks(new Date(baseDate), i);
          break;
        case 'monthly':
          instanceDate = addMonths(new Date(baseDate), i);
          break;
        case 'yearly':
          instanceDate = addYears(new Date(baseDate), i);
          break;
        default:
          instanceDate = addMonths(new Date(baseDate), i);
      }
      instances.push({
        ...expense,
        id: `${expense.id}_${i + 1}`,
        date: instanceDate,
        parentId: expense.id,
        installmentNumber: i + 1,
      });
    }
  }

  return instances.length > 0 ? instances : [expense];
}

export function useFinanceData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Expand recurring expenses into individual instances
  const expandedExpenses = useMemo(() => {
    const allInstances: Expense[] = [];
    expenses.forEach(expense => {
      if (expense.recurrence && expense.recurrence.type !== 'none') {
        allInstances.push(...generateRecurringInstances(expense));
      } else {
        allInstances.push(expense);
      }
    });
    return allInstances;
  }, [expenses]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getMonth() === selectedMonth && incomeDate.getFullYear() === selectedYear;
    });
  }, [incomes, selectedMonth, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return expandedExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
    });
  }, [expandedExpenses, selectedMonth, selectedYear]);

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
    return expandedExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear;
    });
  }, [expandedExpenses, selectedMonth, selectedYear]);

  const totalIncome = useMemo(() => {
    return filteredIncomes.reduce((acc, income) => acc + income.value, 0);
  }, [filteredIncomes]);

  // Only sum expenses that are PAID for the total expense
  const totalExpense = useMemo(() => {
    return filteredExpenses
      .filter(expense => expense.status === 'paid')
      .reduce((acc, expense) => acc + expense.value, 0);
  }, [filteredExpenses]);

  // Scheduled expenses for the month (not yet paid)
  const scheduledExpense = useMemo(() => {
    return filteredExpenses
      .filter(expense => expense.status === 'scheduled')
      .reduce((acc, expense) => acc + expense.value, 0);
  }, [filteredExpenses]);

  const previousTotalIncome = useMemo(() => {
    return previousMonthIncomes.reduce((acc, income) => acc + income.value, 0);
  }, [previousMonthIncomes]);

  const previousTotalExpense = useMemo(() => {
    return previousMonthExpenses
      .filter(expense => expense.status === 'paid')
      .reduce((acc, expense) => acc + expense.value, 0);
  }, [previousMonthExpenses]);

  const balance = totalIncome - totalExpense;
  const previousBalance = previousTotalIncome - previousTotalExpense;

  const dailyBalances = useMemo((): DailyBalance[] => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const balances: DailyBalance[] = [];
    let runningBalance = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayIncomes = filteredIncomes.filter(i => new Date(i.date).getDate() === day);
      // Only count PAID expenses for daily balance
      const dayExpenses = filteredExpenses.filter(e => 
        new Date(e.date).getDate() === day && e.status === 'paid'
      );
      
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
    
    // Only count PAID expenses
    expandedExpenses.filter(e => e.status === 'paid').forEach(expense => {
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
  }, [expandedExpenses, areas, categories, selectedYear]);

  // Get used credit limit for a card (sum of unpaid credit card expenses)
  const getCardUsedLimit = useCallback((cardId: string): number => {
    return expandedExpenses
      .filter(e => e.cardId === cardId && e.status !== 'paid')
      .reduce((acc, e) => acc + e.value, 0);
  }, [expandedExpenses]);

  // Get expenses for a specific invoice (card + month + year)
  const getInvoiceExpenses = useCallback((cardId: string, month: number, year: number): Expense[] => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return [];

    return expandedExpenses.filter(expense => {
      if (expense.cardId !== cardId) return false;
      
      const expenseDate = new Date(expense.date);
      const expenseDay = expenseDate.getDate();
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();

      // If expense date is after closing day, it goes to next month's invoice
      if (expenseDay > card.closingDay) {
        const nextMonth = expenseMonth === 11 ? 0 : expenseMonth + 1;
        const nextYear = expenseMonth === 11 ? expenseYear + 1 : expenseYear;
        return nextMonth === month && nextYear === year;
      } else {
        return expenseMonth === month && expenseYear === year;
      }
    });
  }, [expandedExpenses, cards]);

  // Determine invoice status based on current date and closing day
  const getInvoiceStatus = useCallback((cardId: string, month: number, year: number): InvoiceStatus => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return 'closed';

    // Check if already paid
    const existingInvoice = invoices.find(inv => 
      inv.cardId === cardId && inv.month === month && inv.year === year
    );
    if (existingInvoice?.status === 'paid') return 'paid';

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // If invoice is for current month and before closing day, it's open
    if (year === currentYear && month === currentMonth && currentDay < card.closingDay) {
      return 'open';
    }

    // Otherwise it's closed
    return 'closed';
  }, [cards, invoices]);

  // Generate invoices for cards based on expenses
  const generatedInvoices = useMemo((): Invoice[] => {
    const invoiceMap = new Map<string, Invoice>();

    cards.filter(c => c.type === 'Crédito').forEach(card => {
      // Get all months with expenses for this card
      expandedExpenses
        .filter(e => e.cardId === card.id)
        .forEach(expense => {
          const expenseDate = new Date(expense.date);
          let invoiceMonth = expenseDate.getMonth();
          let invoiceYear = expenseDate.getFullYear();

          // If after closing day, goes to next month
          if (expenseDate.getDate() > card.closingDay) {
            if (invoiceMonth === 11) {
              invoiceMonth = 0;
              invoiceYear++;
            } else {
              invoiceMonth++;
            }
          }

          const key = `${card.id}-${invoiceMonth}-${invoiceYear}`;
          
          if (!invoiceMap.has(key)) {
            const existingInvoice = invoices.find(inv => 
              inv.cardId === card.id && inv.month === invoiceMonth && inv.year === invoiceYear
            );

            invoiceMap.set(key, {
              id: key,
              cardId: card.id,
              month: invoiceMonth,
              year: invoiceYear,
              status: existingInvoice?.status || getInvoiceStatus(card.id, invoiceMonth, invoiceYear),
              totalAmount: 0,
              paidDate: existingInvoice?.paidDate,
              paidFromAccountId: existingInvoice?.paidFromAccountId,
            });
          }

          const invoice = invoiceMap.get(key)!;
          invoice.totalAmount += expense.value;
        });
    });

    return Array.from(invoiceMap.values());
  }, [cards, expandedExpenses, invoices, getInvoiceStatus]);

  // Pay an invoice
  const payInvoice = useCallback((invoiceId: string, paymentDate: Date, accountId: string) => {
    setInvoices(prev => {
      const existing = prev.find(inv => inv.id === invoiceId);
      if (existing) {
        return prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: 'paid' as InvoiceStatus, paidDate: paymentDate, paidFromAccountId: accountId }
            : inv
        );
      } else {
        // Parse invoice ID to get card/month/year
        const parts = invoiceId.split('-');
        const cardId = parts[0];
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const invoice = generatedInvoices.find(inv => inv.id === invoiceId);
        
        return [...prev, {
          id: invoiceId,
          cardId,
          month,
          year,
          status: 'paid' as InvoiceStatus,
          totalAmount: invoice?.totalAmount || 0,
          paidDate: paymentDate,
          paidFromAccountId: accountId,
        }];
      }
    });

    // Update account balance
    const invoice = generatedInvoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, balance: acc.balance - invoice.totalAmount }
          : acc
      ));
    }
  }, [generatedInvoices]);


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

  const updateExpenseStatus = useCallback((expenseId: string, status: 'paid' | 'scheduled', paymentDate?: Date) => {
    setExpenses(prev => prev.map(expense => {
      // Check if it's a recurring instance
      if (expense.id === expenseId || expenseId.startsWith(`${expense.id}_`)) {
        return {
          ...expense,
          status,
          paymentDate: status === 'paid' ? paymentDate || new Date() : undefined,
        };
      }
      return expense;
    }));
  }, []);

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
    allExpenses: expandedExpenses,
    invoices: generatedInvoices,
    totalIncome,
    totalExpense,
    scheduledExpense,
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
    updateExpenseStatus,
    addAccount,
    addCard,
    addArea,
    addCategory,
    clearAllData,
    deleteAccount,
    deleteCard,
    deleteArea,
    deleteCategory,
    getCardUsedLimit,
    getInvoiceExpenses,
    payInvoice,
  };
}