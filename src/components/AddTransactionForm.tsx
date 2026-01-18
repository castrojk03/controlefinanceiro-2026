import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Repeat } from 'lucide-react';
import { Account, Card, Area, Category, TransactionType, ExpenseStatus, RecurrenceType, RecurrenceFrequency, RecurrenceConfig } from '@/types/finance';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CurrencyInput } from '@/components/ui/currency-input';
import { 
  sanitizeText, 
  parseMonetaryValue, 
  parseValidDate, 
  parseInstallments,
  isValidDateRange 
} from '@/lib/validation';

interface AddTransactionFormProps {
  type: 'income' | 'expense';
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

interface FieldError {
  field: string;
  message: string;
}

export function AddTransactionForm({
  type,
  accounts,
  cards,
  areas,
  categories,
  onAddIncome,
  onAddExpense,
}: AddTransactionFormProps) {
  const [errors, setErrors] = useState<FieldError[]>([]);

  // Income form state
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeType, setIncomeType] = useState<TransactionType>('Fixo');
  const [incomeValue, setIncomeValue] = useState('');
  const [incomeNumericValue, setIncomeNumericValue] = useState(0);
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeOrigin, setIncomeOrigin] = useState('');
  const [incomeAccountId, setIncomeAccountId] = useState('');

  // Expense form state
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseType, setExpenseType] = useState<TransactionType>('Variável');
  const [expenseValue, setExpenseValue] = useState('');
  const [expenseNumericValue, setExpenseNumericValue] = useState(0);
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

  const getFieldError = (field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  };

  const resetForm = () => {
    setIncomeDescription('');
    setIncomeType('Fixo');
    setIncomeValue('');
    setIncomeNumericValue(0);
    setIncomeDate(new Date().toISOString().split('T')[0]);
    setIncomeOrigin('');
    setIncomeAccountId('');
    setExpenseDescription('');
    setExpenseType('Variável');
    setExpenseValue('');
    setExpenseNumericValue(0);
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
    setErrors([]);
  };

  const validateIncome = (): boolean => {
    const newErrors: FieldError[] = [];
    
    const sanitizedDescription = sanitizeText(incomeDescription);
    if (!sanitizedDescription) {
      newErrors.push({ field: 'income-description', message: 'Descrição é obrigatória' });
    } else if (sanitizedDescription.length > 200) {
      newErrors.push({ field: 'income-description', message: 'Máximo 200 caracteres' });
    }

    const value = parseMonetaryValue(incomeValue) || incomeNumericValue;
    if (!value || value <= 0) {
      newErrors.push({ field: 'income-value', message: 'Valor deve ser positivo' });
    } else if (value > 999999999.99) {
      newErrors.push({ field: 'income-value', message: 'Valor máximo excedido' });
    }

    const date = parseValidDate(incomeDate);
    if (!date) {
      newErrors.push({ field: 'income-date', message: 'Data inválida' });
    } else if (!isValidDateRange(date)) {
      newErrors.push({ field: 'income-date', message: 'Data deve estar entre 2000 e 2100' });
    }

    const sanitizedOrigin = sanitizeText(incomeOrigin);
    if (!sanitizedOrigin) {
      newErrors.push({ field: 'income-origin', message: 'Origem é obrigatória' });
    } else if (sanitizedOrigin.length > 200) {
      newErrors.push({ field: 'income-origin', message: 'Máximo 200 caracteres' });
    }

    if (!incomeAccountId) {
      newErrors.push({ field: 'income-account', message: 'Selecione uma conta' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateExpense = (): boolean => {
    const newErrors: FieldError[] = [];

    const sanitizedDescription = sanitizeText(expenseDescription);
    if (!sanitizedDescription) {
      newErrors.push({ field: 'expense-description', message: 'Descrição é obrigatória' });
    } else if (sanitizedDescription.length > 200) {
      newErrors.push({ field: 'expense-description', message: 'Máximo 200 caracteres' });
    }

    const value = parseMonetaryValue(expenseValue) || expenseNumericValue;
    if (!value || value <= 0) {
      newErrors.push({ field: 'expense-value', message: 'Valor deve ser positivo' });
    } else if (value > 999999999.99) {
      newErrors.push({ field: 'expense-value', message: 'Valor máximo excedido' });
    }

    const date = parseValidDate(expenseDate);
    if (!date) {
      newErrors.push({ field: 'expense-date', message: 'Data inválida' });
    } else if (!isValidDateRange(date)) {
      newErrors.push({ field: 'expense-date', message: 'Data deve estar entre 2000 e 2100' });
    }

    if (!expenseAccountId) {
      newErrors.push({ field: 'expense-account', message: 'Selecione uma conta' });
    }

    if (!expenseAreaId) {
      newErrors.push({ field: 'expense-area', message: 'Selecione uma área' });
    }

    if (!expenseCategoryId) {
      newErrors.push({ field: 'expense-category', message: 'Selecione uma categoria' });
    }

    if (expenseStatus === 'scheduled') {
      const paymentDate = parseValidDate(expensePaymentDate);
      if (!paymentDate) {
        newErrors.push({ field: 'expense-payment-date', message: 'Data de pagamento é obrigatória para despesas agendadas' });
      }
    }

    if (isRecurrent) {
      if (recurrenceType === 'date_range') {
        const startDate = parseValidDate(recurrenceStartDate);
        const endDate = parseValidDate(recurrenceEndDate);
        if (!startDate) {
          newErrors.push({ field: 'recurrence-start-date', message: 'Data de início inválida' });
        }
        if (!endDate) {
          newErrors.push({ field: 'recurrence-end-date', message: 'Data de fim é obrigatória' });
        }
        if (startDate && endDate && endDate <= startDate) {
          newErrors.push({ field: 'recurrence-end-date', message: 'Data de fim deve ser após início' });
        }
      } else if (recurrenceType === 'installments') {
        const installments = parseInstallments(recurrenceInstallments);
        if (!installments) {
          newErrors.push({ field: 'recurrence-installments', message: 'Número de parcelas inválido (1-360)' });
        }
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleAddIncome = () => {
    if (!validateIncome()) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    const value = parseMonetaryValue(incomeValue) || incomeNumericValue;
    const date = parseValidDate(incomeDate)!;

    onAddIncome({
      description: sanitizeText(incomeDescription),
      type: incomeType,
      value,
      date,
      origin: sanitizeText(incomeOrigin),
      accountId: incomeAccountId,
    });

    toast.success('Receita adicionada com sucesso!');
    resetForm();
  };

  const handleAddExpense = () => {
    if (!validateExpense()) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    const value = parseMonetaryValue(expenseValue) || expenseNumericValue;
    const date = parseValidDate(expenseDate)!;

    let recurrence: RecurrenceConfig | undefined;
    if (isRecurrent) {
      recurrence = {
        type: recurrenceType,
        startDate: parseValidDate(recurrenceStartDate) || undefined,
      };
      
      if (recurrenceType === 'date_range' && recurrenceEndDate) {
        recurrence.endDate = parseValidDate(recurrenceEndDate) || undefined;
      } else if (recurrenceType === 'installments' && recurrenceInstallments) {
        recurrence.installments = parseInstallments(recurrenceInstallments) || undefined;
      } else if (recurrenceType === 'frequency') {
        recurrence.frequency = recurrenceFrequency;
      }
    }

    onAddExpense({
      description: sanitizeText(expenseDescription),
      type: expenseType,
      value,
      date,
      accountId: expenseAccountId,
      cardId: expenseCardId || undefined,
      areaId: expenseAreaId,
      categoryId: expenseCategoryId,
      status: expenseStatus,
      paymentDate: expensePaymentDate ? parseValidDate(expensePaymentDate) || undefined : undefined,
      recurrence,
    });

    toast.success('Despesa adicionada com sucesso!');
    resetForm();
  };

  const ErrorMessage = ({ field }: { field: string }) => {
    const error = getFieldError(field);
    if (!error) return null;
    return (
      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    );
  };

  if (type === 'income') {
    return (
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="income-description">Descrição *</Label>
          <Input
            id="income-description"
            placeholder="Ex: Salário"
            value={incomeDescription}
            onChange={(e) => setIncomeDescription(e.target.value)}
            maxLength={200}
            className={`border-2 ${getFieldError('income-description') ? 'border-destructive' : ''}`}
          />
          <ErrorMessage field="income-description" />
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
            <Label htmlFor="income-value">Valor *</Label>
            <CurrencyInput
              id="income-value"
              placeholder="0,00"
              value={incomeValue}
              onValueChange={(val, num) => {
                setIncomeValue(val);
                setIncomeNumericValue(num);
              }}
              error={!!getFieldError('income-value')}
              className="border-2"
            />
            <ErrorMessage field="income-value" />
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
              className={`border-2 ${getFieldError('income-date') ? 'border-destructive' : ''}`}
            />
            <ErrorMessage field="income-date" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="income-origin">Origem *</Label>
            <Input
              id="income-origin"
              placeholder="Ex: Empresa ABC"
              value={incomeOrigin}
              onChange={(e) => setIncomeOrigin(e.target.value)}
              maxLength={200}
              className={`border-2 ${getFieldError('income-origin') ? 'border-destructive' : ''}`}
            />
            <ErrorMessage field="income-origin" />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="income-account">Conta de Destino *</Label>
          <Select value={incomeAccountId} onValueChange={setIncomeAccountId}>
            <SelectTrigger className={`border-2 ${getFieldError('income-account') ? 'border-destructive' : ''}`}>
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
          <ErrorMessage field="income-account" />
        </div>

        <Button onClick={handleAddIncome} className="w-full border-2 bg-chart-2 text-primary-foreground hover:bg-chart-2/90">
          Adicionar Receita
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="expense-description">Descrição *</Label>
          <Input
            id="expense-description"
            placeholder="Ex: Compras"
            value={expenseDescription}
            onChange={(e) => setExpenseDescription(e.target.value)}
            maxLength={200}
            className={`border-2 ${getFieldError('expense-description') ? 'border-destructive' : ''}`}
          />
          <ErrorMessage field="expense-description" />
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
            <Label htmlFor="expense-value">Valor *</Label>
            <CurrencyInput
              id="expense-value"
              placeholder="0,00"
              value={expenseValue}
              onValueChange={(val, num) => {
                setExpenseValue(val);
                setExpenseNumericValue(num);
              }}
              error={!!getFieldError('expense-value')}
              className="border-2"
            />
            <ErrorMessage field="expense-value" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="expense-date">Data *</Label>
            <Input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className={`border-2 ${getFieldError('expense-date') ? 'border-destructive' : ''}`}
            />
            <ErrorMessage field="expense-date" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expense-account">Conta *</Label>
            <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
              <SelectTrigger className={`border-2 ${getFieldError('expense-account') ? 'border-destructive' : ''}`}>
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
            <ErrorMessage field="expense-account" />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="expense-card">Cartão (opcional)</Label>
          <Select value={expenseCardId} onValueChange={setExpenseCardId}>
            <SelectTrigger className="border-2">
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name} •••• {card.lastDigits}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="expense-area">Área *</Label>
            <Select value={expenseAreaId} onValueChange={(v) => { setExpenseAreaId(v); setExpenseCategoryId(''); }}>
              <SelectTrigger className={`border-2 ${getFieldError('expense-area') ? 'border-destructive' : ''}`}>
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
            <ErrorMessage field="expense-area" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expense-category">Categoria *</Label>
            <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId} disabled={!expenseAreaId}>
              <SelectTrigger className={`border-2 ${getFieldError('expense-category') ? 'border-destructive' : ''}`}>
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
            <ErrorMessage field="expense-category" />
          </div>
        </div>

        {/* Status and Payment Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="expense-status">Status *</Label>
            <Select value={expenseStatus} onValueChange={(v) => setExpenseStatus(v as ExpenseStatus)}>
              <SelectTrigger className="border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">PAGO</SelectItem>
                <SelectItem value="scheduled">AGENDADO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expense-payment-date">Data de Pagamento</Label>
            <Input
              id="expense-payment-date"
              type="date"
              value={expensePaymentDate}
              onChange={(e) => setExpensePaymentDate(e.target.value)}
              className={`border-2 ${getFieldError('expense-payment-date') ? 'border-destructive' : ''}`}
            />
            <ErrorMessage field="expense-payment-date" />
          </div>
        </div>

        {/* Recurrence Section */}
        <div className="border-2 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              <Label htmlFor="is-recurrent">Despesa Recorrente</Label>
            </div>
            <Switch
              id="is-recurrent"
              checked={isRecurrent}
              onCheckedChange={setIsRecurrent}
            />
          </div>

          {isRecurrent && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Tipo de Recorrência</Label>
                <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installments">Parcelas (ex: 12x)</SelectItem>
                    <SelectItem value="date_range">Período (início e fim)</SelectItem>
                    <SelectItem value="frequency">Frequência (semanal/mensal/anual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurrenceType === 'installments' && (
                <div className="grid gap-2">
                  <Label htmlFor="recurrence-installments">Número de Parcelas *</Label>
                  <Input
                    id="recurrence-installments"
                    type="number"
                    placeholder="12"
                    min={1}
                    max={360}
                    value={recurrenceInstallments}
                    onChange={(e) => setRecurrenceInstallments(e.target.value)}
                    className={`border-2 ${getFieldError('recurrence-installments') ? 'border-destructive' : ''}`}
                  />
                  <ErrorMessage field="recurrence-installments" />
                </div>
              )}

              {recurrenceType === 'date_range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="recurrence-start-date">Data de Início *</Label>
                    <Input
                      id="recurrence-start-date"
                      type="date"
                      value={recurrenceStartDate}
                      onChange={(e) => setRecurrenceStartDate(e.target.value)}
                      className={`border-2 ${getFieldError('recurrence-start-date') ? 'border-destructive' : ''}`}
                    />
                    <ErrorMessage field="recurrence-start-date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recurrence-end-date">Data de Fim *</Label>
                    <Input
                      id="recurrence-end-date"
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className={`border-2 ${getFieldError('recurrence-end-date') ? 'border-destructive' : ''}`}
                    />
                    <ErrorMessage field="recurrence-end-date" />
                  </div>
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
  );
}