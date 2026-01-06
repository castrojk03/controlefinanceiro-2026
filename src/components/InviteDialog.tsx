import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccessRole } from '@/hooks/useSharing';
import { UserPlus, Eye, Edit, Shield } from 'lucide-react';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: AccessRole) => void;
}

const roleOptions: { value: AccessRole; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'viewer', 
    label: 'Leitor', 
    description: 'Pode apenas visualizar os dados',
    icon: <Eye className="h-4 w-4" />
  },
  { 
    value: 'editor', 
    label: 'Editor', 
    description: 'Pode visualizar e adicionar transações',
    icon: <Edit className="h-4 w-4" />
  },
  { 
    value: 'admin', 
    label: 'Administrador', 
    description: 'Acesso completo (editar, excluir, gerenciar)',
    icon: <Shield className="h-4 w-4" />
  }
];

export function InviteDialog({ open, onOpenChange, onInvite }: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccessRole>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    await onInvite(email.trim(), role);
    setIsSubmitting(false);
    setEmail('');
    setRole('viewer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar Pessoa
          </DialogTitle>
          <DialogDescription>
            Envie um convite para compartilhar seus dados financeiros.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do convidado</Label>
            <Input
              id="email"
              type="email"
              placeholder="pessoa@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Nível de acesso</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AccessRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <div>
                        <span className="font-medium">{option.label}</span>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-muted/50 border-2 text-sm">
            <p className="font-medium mb-1">Como funciona:</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Um link de convite será gerado e copiado automaticamente</li>
              <li>• Envie o link para a pessoa que deseja convidar</li>
              <li>• O convite expira em 7 dias</li>
              <li>• Você pode cancelar o convite a qualquer momento</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !email.trim()}>
              {isSubmitting ? 'Criando...' : 'Criar Convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
