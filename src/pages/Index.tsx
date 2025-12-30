import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewPanel } from '@/components/OverviewPanel';
import { GeneralPanel } from '@/components/GeneralPanel';
import { DailyPanel } from '@/components/DailyPanel';
import { ReportsPanel } from '@/components/ReportsPanel';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Table, Calendar, BarChart3, Wallet } from 'lucide-react';
const Index = () => {
  const {
    accounts,
    cards,
    areas,
    categories,
    incomes,
    expenses,
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
    deleteCategory
  } = useFinanceData();
  const [activeTab, setActiveTab] = useState('general');
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-primary border-8">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Visão Geral - Always visible */}
        <OverviewPanel totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} previousTotalIncome={previousTotalIncome} previousTotalExpense={previousTotalExpense} previousBalance={previousBalance} selectedMonth={selectedMonth} selectedYear={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} />

        {/* Panel Selection Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 border-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="general" className="gap-2">
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Painel Geral</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Painel Diário</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralPanel incomesByOrigin={incomesByOrigin} expensesByArea={expensesByArea} selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="daily">
            <DailyPanel dailyBalances={dailyBalances} selectedMonth={selectedMonth} selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPanel incomes={incomes} expenses={expenses} areas={areas} totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} selectedMonth={selectedMonth} selectedYear={selectedYear} />
          </TabsContent>
        </Tabs>
      </main>
    </div>;
};
export default Index;