import { useEffect, useState, useMemo } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Search, Receipt, TrendingUp, Building2, CreditCard } from 'lucide-react';
import { Account, Card as CardType, Area, Category, Expense, Income } from '@/types/finance';

interface GlobalSearchDialogProps {
    expenses: Expense[];
    incomes: Income[];
    accounts: Account[];
    cards: CardType[];
    areas: Area[];
    categories: Category[];
    onEditExpense?: (expense: Expense) => void;
    onEditIncome?: (income: Income) => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function GlobalSearchDialog({
    expenses,
    incomes,
    accounts,
    cards,
    areas,
    categories,
    onEditExpense,
    onEditIncome,
}: GlobalSearchDialogProps) {
    const [open, setOpen] = useState(false);

    // Ctrl+K shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Helper maps for resolving names
    const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a.name])), [accounts]);
    const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c.name])), [cards]);
    const areaMap = useMemo(() => new Map(areas.map(a => [a.id, a.name])), [areas]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const handleSelectExpense = (expense: Expense) => {
        setOpen(false);
        onEditExpense?.(expense);
    };

    const handleSelectIncome = (income: Income) => {
        setOpen(false);
        onEditIncome?.(income);
    };

    return (
        <>
            <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(true)}
                title="Buscar (Ctrl+K)"
                className="relative"
            >
                <Search className="h-4 w-4" />
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Buscar despesas, receitas, contas, cartões..." />
                <CommandList>
                    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                    {/* Expenses */}
                    {expenses.length > 0 && (
                        <CommandGroup heading="Despesas">
                            {expenses.slice(0, 50).map((expense) => (
                                <CommandItem
                                    key={`expense-${expense.id}`}
                                    value={`despesa ${expense.description} ${areaMap.get(expense.areaId) || ''} ${categoryMap.get(expense.categoryId) || ''} ${accountMap.get(expense.accountId) || ''}`}
                                    onSelect={() => handleSelectExpense(expense)}
                                    className="cursor-pointer"
                                >
                                    <Receipt className="mr-2 h-4 w-4 text-red-500 shrink-0" />
                                    <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                        <div className="min-w-0">
                                            <span className="font-medium truncate block">{expense.description}</span>
                                            <span className="text-xs text-muted-foreground truncate block">
                                                {areaMap.get(expense.areaId)} · {categoryMap.get(expense.categoryId)} · {formatDate(expense.date)}
                                            </span>
                                        </div>
                                        <span className="font-mono text-sm text-red-500 shrink-0">
                                            -{formatCurrency(expense.value)}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {/* Incomes */}
                    {incomes.length > 0 && (
                        <CommandGroup heading="Receitas">
                            {incomes.slice(0, 50).map((income) => (
                                <CommandItem
                                    key={`income-${income.id}`}
                                    value={`receita ${income.description} ${income.origin} ${accountMap.get(income.accountId) || ''}`}
                                    onSelect={() => handleSelectIncome(income)}
                                    className="cursor-pointer"
                                >
                                    <TrendingUp className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                                    <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                        <div className="min-w-0">
                                            <span className="font-medium truncate block">{income.description}</span>
                                            <span className="text-xs text-muted-foreground truncate block">
                                                {income.origin} · {formatDate(income.date)}
                                            </span>
                                        </div>
                                        <span className="font-mono text-sm text-green-500 shrink-0">
                                            +{formatCurrency(income.value)}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {/* Accounts */}
                    {accounts.length > 0 && (
                        <CommandGroup heading="Contas">
                            {accounts.map((account) => (
                                <CommandItem
                                    key={`account-${account.id}`}
                                    value={`conta ${account.name}`}
                                    className="cursor-pointer"
                                >
                                    <Building2 className="mr-2 h-4 w-4 shrink-0" />
                                    <div className="flex flex-1 items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: account.color }} />
                                            <span className="font-medium">{account.name}</span>
                                        </div>
                                        <span className="font-mono text-sm">{formatCurrency(account.balance)}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {/* Cards */}
                    {cards.length > 0 && (
                        <CommandGroup heading="Cartões">
                            {cards.map((card) => (
                                <CommandItem
                                    key={`card-${card.id}`}
                                    value={`cartão ${card.name} ${card.lastDigits} ${card.type}`}
                                    className="cursor-pointer"
                                >
                                    <CreditCard className="mr-2 h-4 w-4 shrink-0" />
                                    <div className="flex flex-1 items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: card.color }} />
                                            <span className="font-medium">{card.name}</span>
                                            <span className="text-xs text-muted-foreground">•••• {card.lastDigits}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{card.type}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
