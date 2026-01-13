import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Account, Card, Area, Category, TransactionType, ExpenseStatus, Expense } from '@/types/finance';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CurrencyInput } from '@/components/ui/currency-input';
import { 
  sanitizeText, 
  parseMonetaryValue, 
  parseValidDate, 
  isValidDateRange 
} from '@/lib/validation';

interface EditExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  cards: Card[];
  areas: Area[];
  categories: Category[];
  onUpdateExpense: (expense: Expense) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

interface FieldError {
  field: string;
  message: string;
}

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  accounts,
  cards,
  areas,
  categories,
  onUpdateExpense,
  onDeleteExpense,
}: EditExpenseDialogProps) {
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('Variável');
  const [value, setValue] = useState('');
  const [numericValue, setNumericValue] = useState(0);
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<ExpenseStatus>('paid');
  const [paymentDate, setPaymentDate] = useState('');

  const filteredCategories = categories.filter(c => c.areaId === areaId);

  // Populate form when expense changes
  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setType(expense.type);
      const formattedValue = expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setValue(formattedValue);
      setNumericValue(expense.value);
      setDate(expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : new Date(expense.date).toISOString().split('T')[0]);
      setAccountId(expense.accountId);
      setCardId(expense.cardId || '');
      setAreaId(expense.areaId);
      setCategoryId(expense.categoryId);
      setStatus(expense.status);
      setPaymentDate(expense.paymentDate ? (expense.paymentDate instanceof Date ? expense.paymentDate.toISOString().split('T')[0] : new Date(expense.paymentDate).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]);
      setErrors([]);
    }
  }, [expense]);

  const getFieldError = (field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  };

  const validateExpense = (): boolean => {
    const newErrors: FieldError[] = [];

    const sanitizedDescription = sanitizeText(description);
    if (!sanitizedDescription) {
      newErrors.push({ field: 'description', message: 'Descrição é obrigatória' });
    } else if (sanitizedDescription.length > 200) {
      newErrors.push({ field: 'description', message: 'Máximo 200 caracteres' });
    }

    const parsedValue = parseMonetaryValue(value) || numericValue;
    if (!parsedValue || parsedValue <= 0) {
      newErrors.push({ field: 'value', message: 'Valor deve ser positivo' });
    } else if (parsedValue > 999999999.99) {
      newErrors.push({ field: 'value', message: 'Valor máximo excedido' });
    }

    const parsedDate = parseValidDate(date);
    if (!parsedDate) {
      newErrors.push({ field: 'date', message: 'Data inválida' });
    } else if (!isValidDateRange(parsedDate)) {
      newErrors.push({ field: 'date', message: 'Data deve estar entre 2000 e 2100' });
    }

    if (!accountId) {
      newErrors.push({ field: 'account', message: 'Selecione uma conta' });
    }

    if (!areaId) {
      newErrors.push({ field: 'area', message: 'Selecione uma área' });
    }

    if (!categoryId) {
      newErrors.push({ field: 'category', message: 'Selecione uma categoria' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!expense || !validateExpense()) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    const parsedValue = parseMonetaryValue(value) || numericValue;
    const parsedDate = parseValidDate(date)!;

    const updatedExpense: Expense = {
      ...expense,
      description: sanitizeText(description),
      type,
      value: parsedValue,
      date: parsedDate,
      accountId,
      cardId: cardId || undefined,
      areaId,
      categoryId,
      status,
      paymentDate: paymentDate ? parseValidDate(paymentDate) || undefined : undefined,
    };

    await onUpdateExpense(updatedExpense);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!expense) return;
    setIsDeleting(true);
    await onDeleteExpense(expense.id);
    setIsDeleting(false);
    onOpenChange(false);
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

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar Despesa</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Ex: Supermercado"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                className={`border-2 ${getFieldError('description') ? 'border-destructive' : ''}`}
              />
              <ErrorMessage field="description" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
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
                <Label htmlFor="value">Valor *</Label>
                <CurrencyInput
                  id="value"
                  placeholder="0,00"
                  value={value}
                  onValueChange={(val, num) => {
                    setValue(val);
                    setNumericValue(num);
                  }}
                  error={!!getFieldError('value')}
                  className="border-2"
                />
                <ErrorMessage field="value" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`border-2 ${getFieldError('date') ? 'border-destructive' : ''}`}
                />
                <ErrorMessage field="date" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ExpenseStatus)}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(status === 'paid' || status === 'scheduled') && (
              <div className="grid gap-2">
                <Label htmlFor="payment-date">Data de Pagamento</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="border-2"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="account">Conta *</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className={`border-2 ${getFieldError('account') ? 'border-destructive' : ''}`}>
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
              <ErrorMessage field="account" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="card">Cartão (opcional)</Label>
              <Select value={cardId || "none"} onValueChange={(v) => setCardId(v === "none" ? "" : v)}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
              <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="area">Área *</Label>
                <Select value={areaId} onValueChange={(v) => { setAreaId(v); setCategoryId(''); }}>
                  <SelectTrigger className={`border-2 ${getFieldError('area') ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorMessage field="area" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={!areaId}>
                  <SelectTrigger className={`border-2 ${getFieldError('category') ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder={areaId ? "Selecione" : "Escolha uma área"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorMessage field="category" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="border-2"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-2">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="border-2">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
