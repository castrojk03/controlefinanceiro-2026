import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Account,
    Card,
    Expense,
    Income,
    Invoice,
} from '@/types/finance';
import {
    Building2,
    CreditCard,
    ArrowDownCircle,
    ArrowUpCircle,
    Receipt,
    History,
    Palette,
} from 'lucide-react';

interface AccountDetailsDialogProps {
    account: Account | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cards: Card[];
    expenses: Expense[];
    incomes: Income[];
    invoices: Invoice[];
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);

const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export function AccountDetailsDialog({
    account,
    open,
    onOpenChange,
    cards,
    expenses,
    incomes,
    invoices,
}: AccountDetailsDialogProps) {
    if (!account) return null;

    const linkedCards = cards.filter((c) => c.accountId === account.id);
    const linkedExpenses = expenses.filter((e) => e.accountId === account.id);
    const linkedIncomes = incomes.filter((i) => i.accountId === account.id);
    const linkedInvoices = invoices.filter(
        (i) => i.paidFromAccountId === account.id
    );

    // Build a combined timeline of movements sorted by date (most recent first)
    const movements = [
        ...linkedIncomes.map((i) => ({
            type: 'income' as const,
            description: i.description,
            value: i.value,
            date: i.date instanceof Date ? i.date : new Date(i.date),
        })),
        ...linkedExpenses.map((e) => ({
            type: 'expense' as const,
            description: e.description,
            value: e.value,
            date: e.date instanceof Date ? e.date : new Date(e.date),
        })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalIncome = linkedIncomes.reduce((sum, i) => sum + i.value, 0);
    const totalExpense = linkedExpenses
        .filter((e) => e.status === 'paid')
        .reduce((sum, e) => sum + e.value, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-2 sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-lg font-bold">
                        <div
                            className="h-5 w-5 rounded border"
                            style={{ backgroundColor: account.color }}
                        />
                        Detalhes — {account.name}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[65vh] pr-4">
                    <div className="space-y-5">
                        {/* Section: Balance & Color */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border-2 rounded-lg p-3 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    Saldo Atual
                                </div>
                                <p
                                    className={`text-lg font-bold font-mono ${account.balance >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}
                                >
                                    {formatCurrency(account.balance)}
                                </p>
                            </div>
                            <div className="border-2 rounded-lg p-3 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Palette className="h-3.5 w-3.5" />
                                    Cor da Conta
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div
                                        className="h-6 w-6 rounded border"
                                        style={{ backgroundColor: account.color }}
                                    />
                                    <span className="text-sm font-mono text-muted-foreground">
                                        {account.color}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Summary row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border-2 rounded-lg p-3 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ArrowUpCircle className="h-3.5 w-3.5 text-green-500" />
                                    Total Receitas
                                </div>
                                <p className="text-sm font-bold font-mono text-green-500">
                                    {formatCurrency(totalIncome)}
                                </p>
                            </div>
                            <div className="border-2 rounded-lg p-3 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
                                    Total Despesas
                                </div>
                                <p className="text-sm font-bold font-mono text-red-500">
                                    {formatCurrency(totalExpense)}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Section: Linked Cards */}
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                                <CreditCard className="h-4 w-4" />
                                Cartões Vinculados ({linkedCards.length})
                            </h4>
                            {linkedCards.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                    Nenhum cartão vinculado a esta conta
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {linkedCards.map((card) => (
                                        <div
                                            key={card.id}
                                            className="flex items-center justify-between border rounded-md p-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CreditCard
                                                    className="h-4 w-4"
                                                    style={{ color: card.color }}
                                                />
                                                <span className="text-sm">{card.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    •••• {card.lastDigits}
                                                </span>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {card.type}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Section: Recent Incomes */}
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                                Receitas Vinculadas ({linkedIncomes.length})
                            </h4>
                            {linkedIncomes.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                    Nenhuma receita vinculada a esta conta
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {linkedIncomes.slice(0, 5).map((income) => (
                                        <div
                                            key={income.id}
                                            className="flex items-center justify-between border rounded-md p-2"
                                        >
                                            <div>
                                                <p className="text-sm">{income.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(income.date)}
                                                </p>
                                            </div>
                                            <span className="text-sm font-mono text-green-500">
                                                +{formatCurrency(income.value)}
                                            </span>
                                        </div>
                                    ))}
                                    {linkedIncomes.length > 5 && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            ... e mais {linkedIncomes.length - 5} receitas
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Section: Recent Expenses */}
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                                Despesas Vinculadas ({linkedExpenses.length})
                            </h4>
                            {linkedExpenses.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                    Nenhuma despesa vinculada a esta conta
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {linkedExpenses.slice(0, 5).map((expense) => (
                                        <div
                                            key={expense.id}
                                            className="flex items-center justify-between border rounded-md p-2"
                                        >
                                            <div>
                                                <p className="text-sm">{expense.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(expense.date)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-mono text-red-500">
                                                    -{formatCurrency(expense.value)}
                                                </span>
                                                <Badge
                                                    variant={
                                                        expense.status === 'paid' ? 'default' : 'secondary'
                                                    }
                                                    className="ml-2 text-xs"
                                                >
                                                    {expense.status === 'paid' ? 'Pago' : 'Agendado'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {linkedExpenses.length > 5 && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            ... e mais {linkedExpenses.length - 5} despesas
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Section: Linked Invoices */}
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                                <Receipt className="h-4 w-4" />
                                Faturas Pagas por esta Conta ({linkedInvoices.length})
                            </h4>
                            {linkedInvoices.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                    Nenhuma fatura paga por esta conta
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {linkedInvoices.slice(0, 5).map((invoice) => (
                                        <div
                                            key={invoice.id}
                                            className="flex items-center justify-between border rounded-md p-2"
                                        >
                                            <span className="text-sm">
                                                {String(invoice.month + 1).padStart(2, '0')}/
                                                {invoice.year}
                                            </span>
                                            <span className="text-sm font-mono">
                                                {formatCurrency(invoice.totalAmount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Section: Movement History */}
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                                <History className="h-4 w-4" />
                                Histórico de Movimentações ({movements.length})
                            </h4>
                            {movements.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                    Nenhuma movimentação nesta conta
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {movements.slice(0, 10).map((mov, index) => (
                                        <div
                                            key={`${mov.type}-${index}`}
                                            className="flex items-center justify-between border rounded-md p-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                {mov.type === 'income' ? (
                                                    <ArrowUpCircle className="h-3.5 w-3.5 text-green-500" />
                                                ) : (
                                                    <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
                                                )}
                                                <div>
                                                    <p className="text-sm">{mov.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(mov.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-sm font-mono ${mov.type === 'income'
                                                        ? 'text-green-500'
                                                        : 'text-red-500'
                                                    }`}
                                            >
                                                {mov.type === 'income' ? '+' : '-'}
                                                {formatCurrency(mov.value)}
                                            </span>
                                        </div>
                                    ))}
                                    {movements.length > 10 && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            ... e mais {movements.length - 10} movimentações
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
