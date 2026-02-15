import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Account } from '@/types/finance';
import { ColorPicker } from '@/components/ColorPicker';
import { Save, X } from 'lucide-react';

interface EditAccountDialogProps {
    account: Account | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (account: Account) => void;
}

export function EditAccountDialog({
    account,
    open,
    onOpenChange,
    onSave,
}: EditAccountDialogProps) {
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [color, setColor] = useState('');

    // Sync form state when account changes
    useEffect(() => {
        if (account) {
            setName(account.name);
            setBalance(account.balance.toString());
            setColor(account.color);
        }
    }, [account]);

    const handleSave = () => {
        if (!account) return;

        onSave({
            id: account.id,
            name,
            balance: parseFloat(balance) || 0,
            color,
        });

        onOpenChange(false);
    };

    if (!account) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-2 sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">
                        Editar Conta
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Account name (display only) */}
                    <div className="grid gap-2">
                        <Label>Nome da Conta</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border-2"
                        />
                    </div>

                    {/* Balance */}
                    <div className="grid gap-2">
                        <Label>Saldo Atual</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            className="border-2 font-mono"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Color picker */}
                    <ColorPicker value={color} onChange={setColor} label="Cor da Conta" />

                    {/* Preview */}
                    <div className="flex items-center gap-3 border-2 rounded-lg p-3 bg-muted/30">
                        <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: color }}
                        />
                        <div>
                            <p className="font-medium text-sm">{name || 'Nome da conta'}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(parseFloat(balance) || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="gap-2 border-2"
                    >
                        <X className="h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="gap-2 border-2">
                        <Save className="h-4 w-4" />
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
