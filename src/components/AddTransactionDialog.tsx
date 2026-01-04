import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, TrendingUp, TrendingDown, Calendar, Repeat } from 'lucide-react';
import { Account, Card, Area, Category, TransactionType, ExpenseStatus, RecurrenceType, RecurrenceFrequency, RecurrenceConfig } from '@/types/finance';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddTransactionDialogProps {
  accounts: Account[];
  cards: Card[];
  areas: Area[];
  categories: Category[];
  onAddIncome: (income: {
    description: string;
    type: TransactionType;
    value: number;
    date: Date;
    origin: string;
    accountId: string;
  }) => void;
  onAddExpense: (expense: {
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
}

export function AddTransactionDialog({
  accounts,
  cards,
  areas,
  categories,
  onAddIncome,
  onAddExpense,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  // Income form state
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeType, setIncomeType] = useState<TransactionType>('Fixo');
  const [incomeValue, setIncomeValue] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeOrigin, setIncomeOrigin] = useState('');
  const [incomeAccountId, setIncomeAccountId] = useState('');

  // Expense form state
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseType, setExpenseType] = useState<TransactionType>('Variável');
  const [expenseValue, setExpenseValue] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [expenseCardId, setExpenseCardId] = useState('');
  const [expenseAreaId, setExpenseAreaId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  
  // Status and payment date
  const [expenseStatus, setExpenseStatus] = useState<ExpenseStatus>('paid');
  const [expensePaymentDate, setExpensePaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Recurrence state
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('installments');
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceInstallments, setRecurrenceInstallments] = useState('');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('monthly');

  const filteredCategories = categories.filter(c => c.areaId === expenseAreaId);

  const resetForm = () => {
    setIncomeDescription('');
    setIncomeType('Fixo');
    setIncomeValue('');
    setIncomeDate(new Date().toISOString().split('T')[0]);
    setIncomeOrigin('');
    setIncomeAccountId('');
    setExpenseDescription('');
    setExpenseType('Variável');
    setExpenseValue('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseAccountId('');
    setExpenseCardId('');
    setExpenseAreaId('');
    setExpenseCategoryId('');
    setExpenseStatus('paid');
    setExpensePaymentDate(new Date().toISOString().split('T')[0]);
    setIsRecurrent(false);
    setRecurrenceType('installments');
    setRecurrenceStartDate(new Date().toISOString().split('T')[0]);
    setRecurrenceEndDate('');
    setRecurrenceInstallments('');
    setRecurrenceFrequency('monthly');
  };

  const handleAddIncome = () => {
    if (!incomeDescription || !incomeValue || !incomeOrigin || !incomeAccountId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    onAddIncome({
      description: incomeDescription,
      type: incomeType,
      value: parseFloat(incomeValue),
      date: new Date(incomeDate),
      origin: incomeOrigin,
      accountId: incomeAccountId,
    });

    toast.success('Receita adicionada com sucesso!');
    resetForm();
    setOpen(false);
  };

  const handleAddExpense = () => {
    if (!expenseDescription || !expenseValue || !expenseAccountId || !expenseAreaId || !expenseCategoryId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (expenseStatus === 'scheduled' && !expensePaymentDate) {
      toast.error('Selecione a data de pagamento prevista para despesas agendadas');
      return;
    }

    // Build recurrence config if enabled
    let recurrence: RecurrenceConfig | undefined;
    if (isRecurrent) {
      recurrence = {
        type: recurrenceType,
        startDate: new Date(recurrenceStartDate),
      };
      
      if (recurrenceType === 'date_range' && recurrenceEndDate) {
        recurrence.endDate = new Date(recurrenceEndDate);
      } else if (recurrenceType === 'installments' && recurrenceInstallments) {
        recurrence.installments = parseInt(recurrenceInstallments);
      } else if (recurrenceType === 'frequency') {
        recurrence.frequency = recurrenceFrequency;
      }
    }

    onAddExpense({
      description: expenseDescription,
      type: expenseType,
      value: parseFloat(expenseValue),
      date: new Date(expenseDate),
      accountId: expenseAccountId,
      cardId: expenseCardId || undefined,
      areaId: expenseAreaId,
      categoryId: expenseCategoryId,
      status: expenseStatus,
      paymentDate: expensePaymentDate ? new Date(expensePaymentDate) : undefined,
      recurrence,
    });

    toast.success('Despesa adicionada com sucesso!');
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 border-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Adicionar Transação</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'income' | 'expense')}>
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

          <TabsContent value="income" className="mt-4 space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="income-description">Descrição *</Label>
                <Input
                  id="income-description"
                  placeholder="Ex: Salário"
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
                  className="border-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="income-type">Tipo *</Label>
                  <Select value={incomeType} onValueChange={(v) => setIncomeType(v as TransactionType)}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixo">Fixo</SelectItem>
                      <SelectItem value="Variável">Variável</SelectItem>
                      <SelectItem value="Sazonal">Sazonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="income-value">Valor (R$) *</Label>
                  <Input
                    id="income-value"
                    type="number"
                    placeholder="0,00"
                    value={incomeValue}
                    onChange={(e) => setIncomeValue(e.target.value)}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="income-date">Data *</Label>
                  <Input
                    id="income-date"
                    type="date"
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                    className="border-2"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="income-origin">Origem *</Label>
                  <Input
                    id="income-origin"
                    placeholder="Ex: Empresa ABC"
                    value={incomeOrigin}
                    onChange={(e) => setIncomeOrigin(e.target.value)}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="income-account">Conta de Destino *</Label>
                <Select value={incomeAccountId} onValueChange={setIncomeAccountId}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddIncome} className="w-full border-2 bg-chart-2 text-primary-foreground hover:bg-chart-2/90">
              Adicionar Receita
            </Button>
          </TabsContent>

          <TabsContent value="expense" className="mt-4">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expense-description">Descrição *</Label>
                  <Input
                    id="expense-description"
                    placeholder="Ex: Supermercado"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="border-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expense-type">Tipo *</Label>
                    <Select value={expenseType} onValueChange={(v) => setExpenseType(v as TransactionType)}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixo">Fixo</SelectItem>
                        <SelectItem value="Variável">Variável</SelectItem>
                        <SelectItem value="Sazonal">Sazonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="expense-value">Valor (R$) *</Label>
                    <Input
                      id="expense-value"
                      type="number"
                      placeholder="0,00"
                      value={expenseValue}
                      onChange={(e) => setExpenseValue(e.target.value)}
                      className="border-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expense-date">Data da Despesa *</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="border-2"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="expense-account">Conta *</Label>
                    <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expense-card">Cartão (opcional)</Label>
                  <Select value={expenseCardId} onValueChange={(v) => setExpenseCardId(v === 'none' ? '' : v)}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Selecione um cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name} ({card.type}) •••• {card.lastDigits}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expense-area">Área *</Label>
                    <Select value={expenseAreaId} onValueChange={(v) => {
                      setExpenseAreaId(v);
                      setExpenseCategoryId('');
                    }}>
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="expense-category">Categoria *</Label>
                    <Select 
                      value={expenseCategoryId} 
                      onValueChange={setExpenseCategoryId}
                      disabled={!expenseAreaId}
                    >
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status Section */}
                <div className="rounded-lg border-2 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-semibold">Status do Pagamento</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="expense-status">Status *</Label>
                      <Select value={expenseStatus} onValueChange={(v) => setExpenseStatus(v as ExpenseStatus)}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="scheduled">Agendado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="expense-payment-date">
                        {expenseStatus === 'scheduled' ? 'Data de Pagamento Prevista *' : 'Data do Pagamento'}
                      </Label>
                      <Input
                        id="expense-payment-date"
                        type="date"
                        value={expensePaymentDate}
                        onChange={(e) => setExpensePaymentDate(e.target.value)}
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Recurrence Section */}
                <div className="rounded-lg border-2 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-semibold">Recorrência</Label>
                    </div>
                    <Switch
                      checked={isRecurrent}
                      onCheckedChange={setIsRecurrent}
                    />
                  </div>

                  {isRecurrent && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Tipo de Recorrência</Label>
                        <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
                          <SelectTrigger className="border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date_range">Por Data (Início/Fim)</SelectItem>
                            <SelectItem value="installments">Por Parcelas</SelectItem>
                            <SelectItem value="frequency">Por Frequência (Contínuo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          value={recurrenceStartDate}
                          onChange={(e) => setRecurrenceStartDate(e.target.value)}
                          className="border-2"
                        />
                      </div>

                      {recurrenceType === 'date_range' && (
                        <div className="grid gap-2">
                          <Label>Data de Fim</Label>
                          <Input
                            type="date"
                            value={recurrenceEndDate}
                            onChange={(e) => setRecurrenceEndDate(e.target.value)}
                            className="border-2"
                          />
                        </div>
                      )}

                      {recurrenceType === 'installments' && (
                        <div className="grid gap-2">
                          <Label>Número de Parcelas</Label>
                          <Input
                            type="number"
                            min="2"
                            placeholder="Ex: 12"
                            value={recurrenceInstallments}
                            onChange={(e) => setRecurrenceInstallments(e.target.value)}
                            className="border-2"
                          />
                        </div>
                      )}

                      {recurrenceType === 'frequency' && (
                        <div className="grid gap-2">
                          <Label>Frequência</Label>
                          <Select value={recurrenceFrequency} onValueChange={(v) => setRecurrenceFrequency(v as RecurrenceFrequency)}>
                            <SelectTrigger className="border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button onClick={handleAddExpense} className="w-full border-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Adicionar Despesa
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}