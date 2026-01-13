import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewPanel } from '@/components/OverviewPanel';
import { GeneralPanel } from '@/components/GeneralPanel';
import { DailyPanel } from '@/components/DailyPanel';
import { ReportsPanel } from '@/components/ReportsPanel';
import { InvoicesPanel } from '@/components/InvoicesPanel';
import { CalendarPanel } from '@/components/CalendarPanel';
import { ProfilePanel } from '@/components/ProfilePanel';
import { ExpenseListPanel } from '@/components/ExpenseListPanel';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { EditExpenseDialog } from '@/components/EditExpenseDialog';
import { EditIncomeDialog } from '@/components/EditIncomeDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/hooks/useAuth';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { Button } from '@/components/ui/button';
import { Table, Calendar, BarChart3, Wallet, Receipt, CalendarDays, LogOut, User, List } from 'lucide-react';
import { Expense, Income } from '@/types/finance';

const Index = () => {
  // Security hooks - monitor session and inactivity
  useInactivityLogout(30 * 60 * 1000); // 30 minutes inactivity timeout
  useSessionMonitor();
  
  const { signOut, user } = useAuth();
  const {
    accounts,
    cards,
    areas,
    categories,
    incomes,
    expenses,
    allIncomes,
    allExpenses,
    invoices,
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
    updateExpense,
    deleteExpense,
    updateIncome,
    deleteIncome,
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
  } = useFinanceData();
  const [activeTab, setActiveTab] = useState('expenses');
  const [showProfile, setShowProfile] = useState(false);
  
  // Edit expense dialog state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);

  // Edit income dialog state
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editIncomeDialogOpen, setEditIncomeDialogOpen] = useState(false);

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpenseDialogOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setEditIncomeDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-primary border-2">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FinanceFlow</h1>
              <p className="text-xs text-muted-foreground">Gestão Financeira Pessoal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <AddTransactionDialog accounts={accounts} cards={cards} areas={areas} categories={categories} onAddIncome={addIncome} onAddExpense={addExpense} />
            <SettingsDialog accounts={accounts} cards={cards} areas={areas} categories={categories} onAddAccount={addAccount} onAddCard={addCard} onAddArea={addArea} onAddCategory={addCategory} onClearAllData={clearAllData} onDeleteAccount={deleteAccount} onDeleteCard={deleteCard} onDeleteArea={deleteArea} onDeleteCategory={deleteCategory} />
            <Button variant={showProfile ? "default" : "outline"} size="icon" onClick={() => setShowProfile(!showProfile)} title="Perfil">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {showProfile ? (
          <ProfilePanel accounts={accounts} />
        ) : (
          <>
            {/* Visão Geral - Always visible */}
            <OverviewPanel totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} previousTotalIncome={previousTotalIncome} previousTotalExpense={previousTotalExpense} previousBalance={previousBalance} selectedMonth={selectedMonth} selectedYear={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} cards={cards} accounts={accounts} getCardUsedLimit={getCardUsedLimit} />

            {/* Panel Selection Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 border-2 lg:w-auto lg:inline-grid">
                <TabsTrigger value="expenses" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista de Despesas</span>
                </TabsTrigger>
                <TabsTrigger value="general" className="gap-2">
                  <Table className="h-4 w-4" />
                  <span className="hidden sm:inline">Painel Geral</span>
                </TabsTrigger>
                <TabsTrigger value="daily" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Painel Diário</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendário</span>
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Faturas</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatórios</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expenses">
                <ExpenseListPanel 
                  expenses={allExpenses} 
                  accounts={accounts} 
                  cards={cards} 
                  areas={areas} 
                  categories={categories} 
                  onEditExpense={handleEditExpense} 
                />
              </TabsContent>

              <TabsContent value="general">
                <GeneralPanel incomesByOrigin={incomesByOrigin} expensesByArea={expensesByArea} selectedYear={selectedYear} />
              </TabsContent>

              <TabsContent value="daily">
                <DailyPanel 
                  dailyBalances={dailyBalances} 
                  selectedMonth={selectedMonth} 
                  selectedYear={selectedYear} 
                  expenses={expenses}
                  incomes={incomes}
                  areas={areas}
                  categories={categories}
                  onEditExpense={handleEditExpense}
                  onEditIncome={handleEditIncome}
                />
              </TabsContent>

              <TabsContent value="calendar">
                <CalendarPanel 
                  incomes={allIncomes} 
                  expenses={allExpenses} 
                  invoices={invoices} 
                  cards={cards}
                  areas={areas}
                  categories={categories}
                  onEditExpense={handleEditExpense}
                  onEditIncome={handleEditIncome}
                />
              </TabsContent>

              <TabsContent value="invoices">
                <InvoicesPanel 
                  cards={cards} 
                  accounts={accounts} 
                  expenses={expenses} 
                  invoices={invoices} 
                  selectedMonth={selectedMonth} 
                  selectedYear={selectedYear} 
                  onPayInvoice={payInvoice} 
                  getCardUsedLimit={getCardUsedLimit} 
                  getInvoiceExpenses={getInvoiceExpenses}
                  onEditExpense={handleEditExpense}
                />
              </TabsContent>

              <TabsContent value="reports">
                <ReportsPanel incomes={incomes} expenses={expenses} areas={areas} totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} selectedMonth={selectedMonth} selectedYear={selectedYear} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        expense={editingExpense}
        open={editExpenseDialogOpen}
        onOpenChange={setEditExpenseDialogOpen}
        accounts={accounts}
        cards={cards}
        areas={areas}
        categories={categories}
        onUpdateExpense={updateExpense}
        onDeleteExpense={deleteExpense}
      />

      {/* Edit Income Dialog */}
      <EditIncomeDialog
        income={editingIncome}
        open={editIncomeDialogOpen}
        onOpenChange={setEditIncomeDialogOpen}
        accounts={accounts}
        onUpdateIncome={updateIncome}
        onDeleteIncome={deleteIncome}
      />
    </div>
  );
};

export default Index;
