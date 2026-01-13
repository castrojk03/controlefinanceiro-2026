import { useState, useMemo, useCallback, useEffect } from 'react';
import { Account, Card, Area, Category, Income, Expense, DailyBalance, Invoice, InvoiceStatus } from '@/types/finance';
import { initialAreas, initialCategories } from '@/lib/mockData';
import { addMonths, addWeeks, addYears, differenceInMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Load all data from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Load accounts
        const { data: accountsData } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at');
        
        if (accountsData) {
          setAccounts(accountsData.map(a => ({
            id: a.id,
            name: a.name,
            balance: Number(a.balance),
            color: a.color,
          })));
        }

        // Load cards
        const { data: cardsData } = await supabase
          .from('cards')
          .select('*')
          .order('created_at');
        
        if (cardsData) {
          setCards(cardsData.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type as 'Débito' | 'Crédito',
            lastDigits: c.last_digits || '',
            color: c.color,
            accountId: c.account_id || '',
            creditLimit: Number(c.credit_limit),
            dueDay: c.due_day || 1,
            closingDay: c.closing_day || 1,
          })));
        }

        // Load areas
        const { data: areasData } = await supabase
          .from('areas')
          .select('*')
          .order('created_at');
        
        if (areasData && areasData.length > 0) {
          setAreas(areasData.map(a => ({
            id: a.id,
            name: a.name,
            color: a.color,
          })));
        } else {
          // Initialize default areas for new users
          await initializeDefaultAreas();
        }

        // Load categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('created_at');
        
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData.map(c => ({
            id: c.id,
            name: c.name,
            areaId: c.area_id,
          })));
        }

        // Load incomes
        const { data: incomesData } = await supabase
          .from('incomes')
          .select('*')
          .order('date', { ascending: false });
        
        if (incomesData) {
          setIncomes(incomesData.map(i => ({
            id: i.id,
            description: i.description,
            type: i.type as 'Fixo' | 'Variável' | 'Sazonal',
            value: Number(i.value),
            date: new Date(i.date),
            origin: i.origin || '',
            accountId: i.account_id || '',
          })));
        }

        // Load expenses
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });
        
        if (expensesData) {
          setExpenses(expensesData.map(e => ({
            id: e.id,
            description: e.description,
            type: e.type as 'Fixo' | 'Variável' | 'Sazonal',
            value: Number(e.value),
            date: new Date(e.date),
            accountId: e.account_id || '',
            cardId: e.card_id || undefined,
            areaId: e.area_id || '',
            categoryId: e.category_id || '',
            status: e.status as 'paid' | 'scheduled',
            paymentDate: e.payment_date ? new Date(e.payment_date) : undefined,
            recurrence: e.recurrence_type !== 'none' ? {
              type: e.recurrence_type as 'none' | 'date_range' | 'installments' | 'frequency',
              startDate: e.recurrence_start_date ? new Date(e.recurrence_start_date) : undefined,
              endDate: e.recurrence_end_date ? new Date(e.recurrence_end_date) : undefined,
              installments: e.recurrence_installments || undefined,
              frequency: e.recurrence_frequency as 'weekly' | 'monthly' | 'yearly' | undefined,
            } : undefined,
            parentId: e.parent_id || undefined,
            installmentNumber: e.installment_number || undefined,
            totalInstallments: e.total_installments || undefined,
          })));
        }

        // Load invoices
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('*')
          .order('year', { ascending: false });
        
        if (invoicesData) {
          setInvoices(invoicesData.map(i => ({
            id: i.id,
            cardId: i.card_id,
            month: i.month,
            year: i.year,
            status: i.status as InvoiceStatus,
            totalAmount: Number(i.total_amount),
            paidDate: i.paid_date ? new Date(i.paid_date) : undefined,
            paidFromAccountId: i.paid_from_account_id || undefined,
          })));
        }

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Initialize default areas and categories for new users
  const initializeDefaultAreas = async () => {
    if (!user) return;

    try {
      // Insert default areas
      const areasToInsert = initialAreas.map(a => ({
        user_id: user.id,
        name: a.name,
        color: a.color,
      }));

      const { data: insertedAreas, error: areasError } = await supabase
        .from('areas')
        .insert(areasToInsert)
        .select();

      if (areasError) throw areasError;

      if (insertedAreas) {
        // Create mapping from old IDs to new IDs
        const areaIdMap: Record<string, string> = {};
        initialAreas.forEach((oldArea, index) => {
          areaIdMap[oldArea.id] = insertedAreas[index].id;
        });

        // Insert default categories with new area IDs
        const categoriesToInsert = initialCategories.map(c => ({
          user_id: user.id,
          name: c.name,
          area_id: areaIdMap[c.areaId],
        }));

        const { data: insertedCategories, error: catsError } = await supabase
          .from('categories')
          .insert(categoriesToInsert)
          .select();

        if (catsError) throw catsError;

        // Update local state
        setAreas(insertedAreas.map(a => ({
          id: a.id,
          name: a.name,
          color: a.color,
        })));

        if (insertedCategories) {
          setCategories(insertedCategories.map(c => ({
            id: c.id,
            name: c.name,
            areaId: c.area_id,
          })));
        }
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  };

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

  const totalExpense = useMemo(() => {
    return filteredExpenses
      .filter(expense => expense.status === 'paid')
      .reduce((acc, expense) => acc + expense.value, 0);
  }, [filteredExpenses]);

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

  const getCardUsedLimit = useCallback((cardId: string): number => {
    return expandedExpenses
      .filter(e => e.cardId === cardId && e.status !== 'paid')
      .reduce((acc, e) => acc + e.value, 0);
  }, [expandedExpenses]);

  const getInvoiceExpenses = useCallback((cardId: string, month: number, year: number): Expense[] => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return [];

    return expandedExpenses.filter(expense => {
      if (expense.cardId !== cardId) return false;
      
      const expenseDate = new Date(expense.date);
      const expenseDay = expenseDate.getDate();
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();

      if (expenseDay > card.closingDay) {
        const nextMonth = expenseMonth === 11 ? 0 : expenseMonth + 1;
        const nextYear = expenseMonth === 11 ? expenseYear + 1 : expenseYear;
        return nextMonth === month && nextYear === year;
      } else {
        return expenseMonth === month && expenseYear === year;
      }
    });
  }, [expandedExpenses, cards]);

  const getInvoiceStatus = useCallback((cardId: string, month: number, year: number): InvoiceStatus => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return 'closed';

    const existingInvoice = invoices.find(inv => 
      inv.cardId === cardId && inv.month === month && inv.year === year
    );
    if (existingInvoice?.status === 'paid') return 'paid';

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    if (year === currentYear && month === currentMonth && currentDay < card.closingDay) {
      return 'open';
    }

    return 'closed';
  }, [cards, invoices]);

  const generatedInvoices = useMemo((): Invoice[] => {
    const invoiceMap = new Map<string, Invoice>();

    cards.filter(c => c.type === 'Crédito').forEach(card => {
      expandedExpenses
        .filter(e => e.cardId === card.id)
        .forEach(expense => {
          const expenseDate = new Date(expense.date);
          let invoiceMonth = expenseDate.getMonth();
          let invoiceYear = expenseDate.getFullYear();

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

  const payInvoice = useCallback(async (invoiceId: string, paymentDate: Date, accountId: string) => {
    if (!user) return;

    const parts = invoiceId.split('-');
    const cardId = parts[0];
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    const invoice = generatedInvoices.find(inv => inv.id === invoiceId);

    try {
      // Check if invoice already exists in DB
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('card_id', cardId)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      if (existingInvoice) {
        // Update existing
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: paymentDate.toISOString().split('T')[0],
            paid_from_account_id: accountId,
          })
          .eq('id', existingInvoice.id);
      } else {
        // Insert new
        await supabase
          .from('invoices')
          .insert({
            user_id: user.id,
            card_id: cardId,
            month,
            year,
            status: 'paid',
            total_amount: invoice?.totalAmount || 0,
            paid_date: paymentDate.toISOString().split('T')[0],
            paid_from_account_id: accountId,
          });
      }

      // Update account balance
      if (invoice) {
        const { data: account } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', accountId)
          .single();

        if (account) {
          await supabase
            .from('accounts')
            .update({ balance: Number(account.balance) - invoice.totalAmount })
            .eq('id', accountId);
        }
      }

      // Update local state
      setInvoices(prev => {
        const existing = prev.find(inv => inv.id === invoiceId);
        if (existing) {
          return prev.map(inv => 
            inv.id === invoiceId 
              ? { ...inv, status: 'paid' as InvoiceStatus, paidDate: paymentDate, paidFromAccountId: accountId }
              : inv
          );
        } else {
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

      if (invoice) {
        setAccounts(prev => prev.map(acc => 
          acc.id === accountId 
            ? { ...acc, balance: acc.balance - invoice.totalAmount }
            : acc
        ));
      }

      toast.success('Fatura paga com sucesso!');
    } catch (error) {
      console.error('Error paying invoice:', error);
      toast.error('Erro ao pagar fatura');
    }
  }, [user, generatedInvoices]);

  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert({
          user_id: user.id,
          description: income.description,
          type: income.type,
          value: income.value,
          date: income.date.toISOString().split('T')[0],
          origin: income.origin,
          account_id: income.accountId || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newIncome: Income = {
          id: data.id,
          description: data.description,
          type: data.type as 'Fixo' | 'Variável' | 'Sazonal',
          value: Number(data.value),
          date: new Date(data.date),
          origin: data.origin || '',
          accountId: data.account_id || '',
        };
        setIncomes(prev => [newIncome, ...prev]);
        toast.success('Receita adicionada!');
      }
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error('Erro ao adicionar receita');
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description: expense.description,
          type: expense.type,
          value: expense.value,
          date: expense.date.toISOString().split('T')[0],
          account_id: expense.accountId || null,
          card_id: expense.cardId || null,
          area_id: expense.areaId || null,
          category_id: expense.categoryId || null,
          status: expense.status,
          payment_date: expense.paymentDate?.toISOString().split('T')[0] || null,
          recurrence_type: expense.recurrence?.type || 'none',
          recurrence_start_date: expense.recurrence?.startDate?.toISOString().split('T')[0] || null,
          recurrence_end_date: expense.recurrence?.endDate?.toISOString().split('T')[0] || null,
          recurrence_installments: expense.recurrence?.installments || null,
          recurrence_frequency: expense.recurrence?.frequency || null,
          parent_id: expense.parentId || null,
          installment_number: expense.installmentNumber || null,
          total_installments: expense.totalInstallments || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newExpense: Expense = {
          id: data.id,
          description: data.description,
          type: data.type as 'Fixo' | 'Variável' | 'Sazonal',
          value: Number(data.value),
          date: new Date(data.date),
          accountId: data.account_id || '',
          cardId: data.card_id || undefined,
          areaId: data.area_id || '',
          categoryId: data.category_id || '',
          status: data.status as 'paid' | 'scheduled',
          paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
          recurrence: data.recurrence_type !== 'none' ? {
            type: data.recurrence_type as 'none' | 'date_range' | 'installments' | 'frequency',
            startDate: data.recurrence_start_date ? new Date(data.recurrence_start_date) : undefined,
            endDate: data.recurrence_end_date ? new Date(data.recurrence_end_date) : undefined,
            installments: data.recurrence_installments || undefined,
            frequency: data.recurrence_frequency as 'weekly' | 'monthly' | 'yearly' | undefined,
          } : undefined,
        };
        setExpenses(prev => [newExpense, ...prev]);
        toast.success('Despesa adicionada!');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Erro ao adicionar despesa');
    }
  };

  const updateExpenseStatus = useCallback(async (expenseId: string, status: 'paid' | 'scheduled', paymentDate?: Date) => {
    try {
      // Handle recurring expense instances
      const baseId = expenseId.includes('_') ? expenseId.split('_')[0] : expenseId;
      
      await supabase
        .from('expenses')
        .update({
          status,
          payment_date: status === 'paid' ? (paymentDate || new Date()).toISOString().split('T')[0] : null,
        })
        .eq('id', baseId);

      setExpenses(prev => prev.map(expense => {
        if (expense.id === baseId) {
          return {
            ...expense,
            status,
            paymentDate: status === 'paid' ? paymentDate || new Date() : undefined,
          };
        }
        return expense;
      }));

      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast.error('Erro ao atualizar status');
    }
  }, []);

  const updateExpense = useCallback(async (expense: Expense) => {
    try {
      // Handle recurring expense instances - update the base expense
      const baseId = expense.id.includes('_') ? expense.id.split('_')[0] : expense.id;
      
      const { error } = await supabase
        .from('expenses')
        .update({
          description: expense.description,
          type: expense.type,
          value: expense.value,
          date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
          account_id: expense.accountId || null,
          card_id: expense.cardId || null,
          area_id: expense.areaId || null,
          category_id: expense.categoryId || null,
          status: expense.status,
          payment_date: expense.paymentDate 
            ? (expense.paymentDate instanceof Date ? expense.paymentDate.toISOString().split('T')[0] : expense.paymentDate) 
            : null,
        })
        .eq('id', baseId);

      if (error) throw error;

      setExpenses(prev => prev.map(e => {
        if (e.id === baseId) {
          return {
            ...e,
            description: expense.description,
            type: expense.type,
            value: expense.value,
            date: expense.date instanceof Date ? expense.date : new Date(expense.date),
            accountId: expense.accountId,
            cardId: expense.cardId,
            areaId: expense.areaId,
            categoryId: expense.categoryId,
            status: expense.status,
            paymentDate: expense.paymentDate 
              ? (expense.paymentDate instanceof Date ? expense.paymentDate : new Date(expense.paymentDate)) 
              : undefined,
          };
        }
        return e;
      }));

      toast.success('Despesa atualizada!');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Erro ao atualizar despesa');
    }
  }, []);

  const deleteExpense = useCallback(async (expenseId: string) => {
    try {
      // Handle recurring expense instances - delete the base expense
      const baseId = expenseId.includes('_') ? expenseId.split('_')[0] : expenseId;
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', baseId);

      if (error) throw error;

      setExpenses(prev => prev.filter(e => e.id !== baseId));
      toast.success('Despesa excluída!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Erro ao excluir despesa');
    }
  }, []);

  const addAccount = async (account: Omit<Account, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: account.name,
          balance: account.balance,
          color: account.color,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newAccount: Account = {
          id: data.id,
          name: data.name,
          balance: Number(data.balance),
          color: data.color,
        };
        setAccounts(prev => [...prev, newAccount]);
        toast.success('Conta adicionada!');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Erro ao adicionar conta');
    }
  };

  const addCard = async (card: Omit<Card, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          user_id: user.id,
          name: card.name,
          type: card.type,
          last_digits: card.lastDigits,
          color: card.color,
          account_id: card.accountId || null,
          credit_limit: card.creditLimit,
          due_day: card.dueDay,
          closing_day: card.closingDay,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newCard: Card = {
          id: data.id,
          name: data.name,
          type: data.type as 'Débito' | 'Crédito',
          lastDigits: data.last_digits || '',
          color: data.color,
          accountId: data.account_id || '',
          creditLimit: Number(data.credit_limit),
          dueDay: data.due_day || 1,
          closingDay: data.closing_day || 1,
        };
        setCards(prev => [...prev, newCard]);
        toast.success('Cartão adicionado!');
      }
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Erro ao adicionar cartão');
    }
  };

  const addArea = async (area: Omit<Area, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('areas')
        .insert({
          user_id: user.id,
          name: area.name,
          color: area.color,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newArea: Area = {
          id: data.id,
          name: data.name,
          color: data.color,
        };
        setAreas(prev => [...prev, newArea]);
        toast.success('Área adicionada!');
      }
    } catch (error) {
      console.error('Error adding area:', error);
      toast.error('Erro ao adicionar área');
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: category.name,
          area_id: category.areaId,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newCategory: Category = {
          id: data.id,
          name: data.name,
          areaId: data.area_id,
        };
        setCategories(prev => [...prev, newCategory]);
        toast.success('Categoria adicionada!');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Erro ao adicionar categoria');
    }
  };

  const clearAllData = useCallback(async () => {
    if (!user) return;

    try {
      await Promise.all([
        supabase.from('expenses').delete().eq('user_id', user.id),
        supabase.from('incomes').delete().eq('user_id', user.id),
        supabase.from('invoices').delete().eq('user_id', user.id),
        supabase.from('categories').delete().eq('user_id', user.id),
        supabase.from('areas').delete().eq('user_id', user.id),
        supabase.from('cards').delete().eq('user_id', user.id),
        supabase.from('accounts').delete().eq('user_id', user.id),
      ]);

      setAccounts([]);
      setCards([]);
      setAreas([]);
      setCategories([]);
      setIncomes([]);
      setExpenses([]);
      setInvoices([]);

      toast.success('Dados limpos com sucesso!');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Erro ao limpar dados');
    }
  }, [user]);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      await supabase.from('accounts').delete().eq('id', id);
      setAccounts((prev) => prev.filter((account) => account.id !== id));
      toast.success('Conta removida!');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erro ao remover conta');
    }
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    try {
      await supabase.from('cards').delete().eq('id', id);
      setCards((prev) => prev.filter((card) => card.id !== id));
      toast.success('Cartão removido!');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Erro ao remover cartão');
    }
  }, []);

  const deleteArea = useCallback(async (id: string) => {
    try {
      await supabase.from('areas').delete().eq('id', id);
      setAreas((prev) => prev.filter((area) => area.id !== id));
      setCategories((prev) => prev.filter((category) => category.areaId !== id));
      toast.success('Área removida!');
    } catch (error) {
      console.error('Error deleting area:', error);
      toast.error('Erro ao remover área');
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await supabase.from('categories').delete().eq('id', id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      toast.success('Categoria removida!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao remover categoria');
    }
  }, []);

  const updateIncome = useCallback(async (income: Income) => {
    try {
      const { error } = await supabase
        .from('incomes')
        .update({
          description: income.description,
          type: income.type,
          value: income.value,
          date: income.date instanceof Date ? income.date.toISOString().split('T')[0] : income.date,
          origin: income.origin,
          account_id: income.accountId || null,
        })
        .eq('id', income.id);

      if (error) throw error;

      setIncomes(prev => prev.map(i => {
        if (i.id === income.id) {
          return {
            ...i,
            description: income.description,
            type: income.type,
            value: income.value,
            date: income.date instanceof Date ? income.date : new Date(income.date),
            origin: income.origin,
            accountId: income.accountId,
          };
        }
        return i;
      }));

      toast.success('Receita atualizada!');
    } catch (error) {
      console.error('Error updating income:', error);
      toast.error('Erro ao atualizar receita');
    }
  }, []);

  const deleteIncome = useCallback(async (incomeId: string) => {
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', incomeId);

      if (error) throw error;

      setIncomes(prev => prev.filter(i => i.id !== incomeId));
      toast.success('Receita excluída!');
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('Erro ao excluir receita');
    }
  }, []);

  const updateExpenseDate = useCallback(async (expenseId: string, newDate: Date) => {
    try {
      // Handle recurring expense instances
      const baseId = expenseId.includes('_') ? expenseId.split('_')[0] : expenseId;
      
      const { error } = await supabase
        .from('expenses')
        .update({
          date: newDate.toISOString().split('T')[0],
          payment_date: newDate.toISOString().split('T')[0],
        })
        .eq('id', baseId);

      if (error) throw error;

      setExpenses(prev => prev.map(e => {
        if (e.id === baseId) {
          return {
            ...e,
            date: newDate,
            paymentDate: newDate,
          };
        }
        return e;
      }));

      toast.success('Data da despesa atualizada!');
    } catch (error) {
      console.error('Error updating expense date:', error);
      toast.error('Erro ao atualizar data');
    }
  }, []);

  const updateIncomeDate = useCallback(async (incomeId: string, newDate: Date) => {
    try {
      const { error } = await supabase
        .from('incomes')
        .update({
          date: newDate.toISOString().split('T')[0],
        })
        .eq('id', incomeId);

      if (error) throw error;

      setIncomes(prev => prev.map(i => {
        if (i.id === incomeId) {
          return {
            ...i,
            date: newDate,
          };
        }
        return i;
      }));

      toast.success('Data da receita atualizada!');
    } catch (error) {
      console.error('Error updating income date:', error);
      toast.error('Erro ao atualizar data');
    }
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
    updateExpense,
    deleteExpense,
    updateExpenseStatus,
    updateExpenseDate,
    updateIncome,
    deleteIncome,
    updateIncomeDate,
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
    loading,
  };
}
