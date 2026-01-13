import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Building2, CreditCard, Tags, FolderOpen, Plus, Trash2, Wallet } from 'lucide-react';
import { Account, Card as CardType, Area, Category, PaymentMethod } from '@/types/finance';
import { BudgetsSettingsTab } from '@/components/BudgetsSettingsTab';
import { toast } from 'sonner';

type DeleteItem = 
  | { type: 'account'; id: string; name: string }
  | { type: 'card'; id: string; name: string }
  | { type: 'area'; id: string; name: string }
  | { type: 'category'; id: string; name: string }
  | null;

interface SettingsDialogProps {
  accounts: Account[];
  cards: CardType[];
  areas: Area[];
  categories: Category[];
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onAddCard: (card: Omit<CardType, 'id'>) => void;
  onAddArea: (area: Omit<Area, 'id'>) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onClearAllData: () => void;
  onDeleteAccount: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onDeleteArea: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  // Budget props
  getBudgetForCategory: (categoryId: string) => number | null;
  onSaveBudget: (categoryId: string, amount: number) => void;
  onDeleteBudget: (categoryId: string) => void;
  onCopyBudgetsFromPreviousMonth: () => void;
  budgetMonth: number;
  budgetYear: number;
  onBudgetMonthChange: (month: number) => void;
  onBudgetYearChange: (year: number) => void;
}

const COLORS = [
  { name: 'Vermelho', value: 'hsl(0, 84%, 60%)' },
  { name: 'Laranja', value: 'hsl(30, 80%, 55%)' },
  { name: 'Amarelo', value: 'hsl(45, 80%, 50%)' },
  { name: 'Verde', value: 'hsl(140, 70%, 45%)' },
  { name: 'Azul', value: 'hsl(210, 80%, 55%)' },
  { name: 'Roxo', value: 'hsl(280, 70%, 55%)' },
  { name: 'Rosa', value: 'hsl(340, 70%, 55%)' },
];

export function SettingsDialog({
  accounts,
  cards,
  areas,
  categories,
  onAddAccount,
  onAddCard,
  onAddArea,
  onAddCategory,
  onClearAllData,
  onDeleteAccount,
  onDeleteCard,
  onDeleteArea,
  onDeleteCategory,
  getBudgetForCategory,
  onSaveBudget,
  onDeleteBudget,
  onCopyBudgetsFromPreviousMonth,
  budgetMonth,
  budgetYear,
  onBudgetMonthChange,
  onBudgetYearChange,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DeleteItem>(null);

  const handleConfirmDelete = () => {
    if (!deleteItem) return;
    
    switch (deleteItem.type) {
      case 'account':
        onDeleteAccount(deleteItem.id);
        toast.success('Conta excluída!');
        break;
      case 'card':
        onDeleteCard(deleteItem.id);
        toast.success('Cartão excluído!');
        break;
      case 'area':
        onDeleteArea(deleteItem.id);
        toast.success('Área e categorias vinculadas excluídas!');
        break;
      case 'category':
        onDeleteCategory(deleteItem.id);
        toast.success('Categoria excluída!');
        break;
    }
    setDeleteItem(null);
  };

  const getDeleteMessage = () => {
    if (!deleteItem) return '';
    switch (deleteItem.type) {
      case 'account':
        return `Tem certeza que deseja excluir a conta "${deleteItem.name}"?`;
      case 'card':
        return `Tem certeza que deseja excluir o cartão "${deleteItem.name}"?`;
      case 'area':
        return `Tem certeza que deseja excluir a área "${deleteItem.name}"? Todas as categorias vinculadas também serão excluídas!`;
      case 'category':
        return `Tem certeza que deseja excluir a categoria "${deleteItem.name}"?`;
    }
  };

  // Account form
  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [accountColor, setAccountColor] = useState(COLORS[0].value);

  // Card form
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState<PaymentMethod>('Crédito');
  const [cardDigits, setCardDigits] = useState('');
  const [cardColor, setCardColor] = useState(COLORS[1].value);
  const [cardAccountId, setCardAccountId] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardDueDay, setCardDueDay] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('');

  // Area form
  const [areaName, setAreaName] = useState('');
  const [areaColor, setAreaColor] = useState(COLORS[2].value);

  // Category form
  const [categoryName, setCategoryName] = useState('');
  const [categoryAreaId, setCategoryAreaId] = useState('');

  const handleAddAccount = () => {
    if (!accountName || !accountBalance) {
      toast.error('Preencha todos os campos');
      return;
    }
    onAddAccount({
      name: accountName,
      balance: parseFloat(accountBalance),
      color: accountColor,
    });
    toast.success('Conta adicionada!');
    setAccountName('');
    setAccountBalance('');
  };

  const handleAddCard = () => {
    if (!cardName || !cardDigits || !cardAccountId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    onAddCard({
      name: cardName,
      type: cardType,
      lastDigits: cardDigits,
      color: cardColor,
      accountId: cardAccountId,
      creditLimit: parseFloat(cardLimit) || 0,
      dueDay: parseInt(cardDueDay) || 10,
      closingDay: parseInt(cardClosingDay) || 1,
    });
    toast.success('Cartão adicionado!');
    setCardName('');
    setCardDigits('');
    setCardAccountId('');
    setCardLimit('');
    setCardDueDay('');
    setCardClosingDay('');
  };

  const handleAddArea = () => {
    if (!areaName) {
      toast.error('Preencha o nome da área');
      return;
    }
    onAddArea({
      name: areaName,
      color: areaColor,
    });
    toast.success('Área adicionada!');
    setAreaName('');
  };

  const handleAddCategory = () => {
    if (!categoryName || !categoryAreaId) {
      toast.error('Preencha todos os campos');
      return;
    }
    onAddCategory({
      name: categoryName,
      areaId: categoryAreaId,
    });
    toast.success('Categoria adicionada!');
    setCategoryName('');
    setCategoryAreaId('');
  };

  const handleClearAllData = () => {
    onClearAllData();
    toast.success('Todos os dados foram removidos!');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-2">
          <Settings className="h-4 w-4" />
          Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Configurações</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="accounts">
          <TabsList className="grid w-full grid-cols-6 border-2">
            <TabsTrigger value="accounts" className="gap-1 text-xs">
              <Building2 className="h-3 w-3" />
              <span className="hidden sm:inline">Contas</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-1 text-xs">
              <CreditCard className="h-3 w-3" />
              <span className="hidden sm:inline">Cartões</span>
            </TabsTrigger>
            <TabsTrigger value="areas" className="gap-1 text-xs">
              <FolderOpen className="h-3 w-3" />
              <span className="hidden sm:inline">Áreas</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1 text-xs">
              <Tags className="h-3 w-3" />
              <span className="hidden sm:inline">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="budgets" className="gap-1 text-xs">
              <Wallet className="h-3 w-3" />
              <span className="hidden sm:inline">Orçamentos</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-1 text-xs text-destructive">
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">Limpar</span>
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="mt-4 space-y-4">
            <div className="grid gap-4 border-2 p-4">
              <h4 className="font-semibold">Nova Conta</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Conta Corrente"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Saldo Inicial</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Cor</Label>
                <Select value={accountColor} onValueChange={setAccountColor}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border" style={{ backgroundColor: color.value }} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAccount} className="gap-2 border-2">
                <Plus className="h-4 w-4" />
                Adicionar Conta
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Contas Cadastradas</h4>
              <ScrollArea className="h-40">
                <div className="space-y-2 pr-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between border-2 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 border" style={{ backgroundColor: account.color }} />
                        <span className="font-medium">{account.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                        </span>
                      <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteItem({ type: 'account', id: account.id, name: account.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="mt-4 space-y-4">
            <div className="grid gap-4 border-2 p-4">
              <h4 className="font-semibold">Novo Cartão</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Nubank"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={cardType} onValueChange={(v) => setCardType(v as PaymentMethod)}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Crédito">Crédito</SelectItem>
                      <SelectItem value="Débito">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Últimos 4 dígitos</Label>
                  <Input
                    placeholder="0000"
                    maxLength={4}
                    value={cardDigits}
                    onChange={(e) => setCardDigits(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Conta Vinculada</Label>
                  <Select value={cardAccountId} onValueChange={setCardAccountId}>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Limite do Cartão</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dia de Vencimento</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    min={1}
                    max={31}
                    value={cardDueDay}
                    onChange={(e) => setCardDueDay(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dia de Fechamento</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    min={1}
                    max={31}
                    value={cardClosingDay}
                    onChange={(e) => setCardClosingDay(e.target.value)}
                    className="border-2"
                  />
                </div>
              </div>
              <Button onClick={handleAddCard} className="gap-2 border-2">
                <Plus className="h-4 w-4" />
                Adicionar Cartão
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Cartões Cadastrados</h4>
              <ScrollArea className="h-40">
                <div className="space-y-2 pr-4">
                  {cards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between border-2 p-3">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5" style={{ color: card.color }} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{card.name}</span>
                            <span className="text-sm text-muted-foreground">•••• {card.lastDigits}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Venc. dia {card.dueDay} | Fecha dia {card.closingDay}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{card.type}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteItem({ type: 'card', id: card.id, name: card.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Areas Tab */}
          <TabsContent value="areas" className="mt-4 space-y-4">
            <div className="grid gap-4 border-2 p-4">
              <h4 className="font-semibold">Nova Área</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Moradia"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Cor</Label>
                  <Select value={areaColor} onValueChange={setAreaColor}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border" style={{ backgroundColor: color.value }} />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddArea} className="gap-2 border-2">
                <Plus className="h-4 w-4" />
                Adicionar Área
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Áreas Cadastradas</h4>
              <ScrollArea className="h-40">
                <div className="space-y-2 pr-4">
                  {areas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between border-2 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 border" style={{ backgroundColor: area.color }} />
                        <span className="font-medium">{area.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({categories.filter(c => c.areaId === area.id).length} categorias)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteItem({ type: 'area', id: area.id, name: area.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-4 space-y-4">
            <div className="grid gap-4 border-2 p-4">
              <h4 className="font-semibold">Nova Categoria</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Aluguel"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Área</Label>
                  <Select value={categoryAreaId} onValueChange={setCategoryAreaId}>
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
              </div>
              <Button onClick={handleAddCategory} className="gap-2 border-2">
                <Plus className="h-4 w-4" />
                Adicionar Categoria
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Categorias por Área</h4>
              <ScrollArea className="h-48">
                <div className="space-y-2 pr-4">
                  {areas.map((area) => (
                    <div key={area.id} className="border-2 p-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <div className="h-3 w-3 border" style={{ backgroundColor: area.color }} />
                        {area.name}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {categories.filter(c => c.areaId === area.id).map((category) => (
                          <span key={category.id} className="inline-flex items-center gap-1 border-2 bg-secondary px-2 py-1 text-sm">
                            {category.name}
                            <button
                              className="ml-1 text-destructive hover:text-destructive/80"
                              onClick={() => setDeleteItem({ type: 'category', id: category.id, name: category.name })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="mt-4">
            <BudgetsSettingsTab
              areas={areas}
              categories={categories}
              getBudgetForCategory={getBudgetForCategory}
              onSaveBudget={onSaveBudget}
              onDeleteBudget={onDeleteBudget}
              onCopyFromPreviousMonth={onCopyBudgetsFromPreviousMonth}
              selectedMonth={budgetMonth}
              selectedYear={budgetYear}
              onMonthChange={onBudgetMonthChange}
              onYearChange={onBudgetYearChange}
            />
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="mt-4 space-y-4">
            <div className="border-2 border-destructive p-4 space-y-4">
              <h4 className="font-semibold text-destructive">Zona de Perigo</h4>
              <p className="text-sm text-muted-foreground">
                Esta ação irá remover permanentemente todas as informações cadastradas: contas, cartões, áreas, categorias, receitas e despesas.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleClearAllData}
                className="gap-2 border-2"
              >
                <Trash2 className="h-4 w-4" />
                Remover Todos os Dados
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent className="border-2">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
