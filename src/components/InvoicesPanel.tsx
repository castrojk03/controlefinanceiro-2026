import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CreditCard, Receipt, CalendarDays, Check, Pencil } from 'lucide-react';
import { Card as CardType, Expense, Invoice, InvoiceStatus, Account } from '@/types/finance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InvoicesPanelProps {
  cards: CardType[];
  accounts: Account[];
  expenses: Expense[];
  invoices: Invoice[];
  selectedMonth: number;
  selectedYear: number;
  onPayInvoice: (invoiceId: string, paymentDate: Date, accountId: string) => void;
  getCardUsedLimit: (cardId: string) => number;
  getInvoiceExpenses: (cardId: string, month: number, year: number) => Expense[];
  onEditExpense?: (expense: Expense) => void;
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

const getStatusBadge = (status: InvoiceStatus) => {
  switch (status) {
    case 'open':
      return <Badge className="bg-blue-500 hover:bg-blue-600">ABERTA</Badge>;
    case 'closed':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">FECHADA</Badge>;
    case 'paid':
      return <Badge className="bg-green-500 hover:bg-green-600">PAGA</Badge>;
  }
};

export function InvoicesPanel({
  cards,
  accounts,
  expenses,
  invoices,
  selectedMonth,
  selectedYear,
  onPayInvoice,
  getCardUsedLimit,
  getInvoiceExpenses,
  onEditExpense,
}: InvoicesPanelProps) {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  const [showPayConfirm, setShowPayConfirm] = useState(false);

  // Get invoices for selected card, sorted by date (most recent first)
  const cardInvoices = useMemo(() => {
    if (!selectedCard) return [];
    return invoices
      .filter(inv => inv.cardId === selectedCard.id)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [invoices, selectedCard]);

  // Get expenses for selected invoice
  const invoiceExpenses = useMemo(() => {
    if (!selectedInvoice || !selectedCard) return [];
    return getInvoiceExpenses(selectedCard.id, selectedInvoice.month, selectedInvoice.year);
  }, [selectedInvoice, selectedCard, getInvoiceExpenses]);

  const handlePayInvoice = () => {
    if (!selectedInvoice || !paymentDate || !selectedCard) return;
    
    const card = cards.find(c => c.id === selectedCard.id);
    if (!card) return;

    onPayInvoice(selectedInvoice.id, paymentDate, card.accountId);
    toast.success('Fatura paga com sucesso!');
    setShowPayConfirm(false);
    setPaymentDate(undefined);
    setSelectedInvoice(null);
  };

  // Credit cards only (type === 'Crédito')
  const creditCards = cards.filter(c => c.type === 'Crédito');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Cartões de Crédito</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creditCards.length === 0 ? (
            <p className="text-muted-foreground col-span-full">Nenhum cartão de crédito cadastrado.</p>
          ) : (
            creditCards.map(card => {
              const usedLimit = getCardUsedLimit(card.id);
              const availableLimit = card.creditLimit - usedLimit;
              const account = accounts.find(a => a.id === card.accountId);

              return (
                <Card 
                  key={card.id} 
                  className="border-2 cursor-pointer transition-all hover:shadow-md"
                  onClick={() => setSelectedCard(card)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="h-8 w-8" style={{ color: card.color }} />
                      <div>
                        <p className="font-semibold">{card.name}</p>
                        <p className="text-xs text-muted-foreground">•••• {card.lastDigits}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Venc. dia {card.dueDay} | Fecha dia {card.closingDay}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Limite</span>
                        <span className="font-medium">{formatCurrency(card.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Utilizado</span>
                        <span className="font-medium text-destructive">{formatCurrency(usedLimit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Disponível</span>
                        <span className="font-medium text-chart-2">{formatCurrency(availableLimit)}</span>
                      </div>
                    </div>
                    {account && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Conta: {account.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Card Invoices Dialog */}
      <Dialog open={!!selectedCard && !selectedInvoice} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="border-2 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Faturas de {selectedCard?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {cardInvoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma fatura encontrada.</p>
              ) : (
                cardInvoices.map(invoice => (
                  <div 
                    key={invoice.id}
                    className="flex items-center justify-between border-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div>
                      <p className="font-medium">{MONTHS[invoice.month]} {invoice.year}</p>
                      <p className="text-sm font-mono">{formatCurrency(invoice.totalAmount)}</p>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="border-2 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Fatura {selectedInvoice && `${MONTHS[selectedInvoice.month]} ${selectedInvoice.year}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{selectedInvoice && formatCurrency(selectedInvoice.totalAmount)}</p>
                <p className="text-sm text-muted-foreground">Total da fatura</p>
              </div>
              {selectedInvoice && getStatusBadge(selectedInvoice.status)}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Despesas da Fatura</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {invoiceExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhuma despesa nesta fatura.</p>
                  ) : (
                    invoiceExpenses.map(expense => (
                      <div key={expense.id} className="flex items-center justify-between border p-2 hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(expense.date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{formatCurrency(expense.value)}</span>
                          {onEditExpense && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditExpense(expense)}
                              className="h-8 w-8"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {selectedInvoice?.status === 'closed' && (
              <div className="pt-4 border-t">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="w-full gap-2">
                      <Check className="h-4 w-4" />
                      Pagar Fatura
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => {
                        setPaymentDate(date);
                        if (date) setShowPayConfirm(true);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {selectedInvoice?.status === 'paid' && selectedInvoice.paidDate && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Paga em: {format(new Date(selectedInvoice.paidDate), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={showPayConfirm} onOpenChange={setShowPayConfirm}>
        <AlertDialogContent className="border-2">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar pagamento de {selectedInvoice && formatCurrency(selectedInvoice.totalAmount)} na data {paymentDate && format(paymentDate, 'dd/MM/yyyy')}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentDate(undefined)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayInvoice}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
