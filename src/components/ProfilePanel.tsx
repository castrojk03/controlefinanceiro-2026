import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSharing, AccessRole } from '@/hooks/useSharing';
import { Account } from '@/types/finance';
import { InviteDialog } from './InviteDialog';
import { SharedMembersList } from './SharedMembersList';
import { User, Wallet, Users, Mail, Calendar, Link2, X, Copy, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface ProfilePanelProps {
  accounts: Account[];
}

const roleLabels: Record<AccessRole, string> = {
  viewer: 'Leitor',
  editor: 'Editor',
  admin: 'Administrador'
};

export function ProfilePanel({ accounts }: ProfilePanelProps) {
  const { user } = useAuth();
  const { sharedMembers, invitations, loading, createInvitation, cancelInvitation, removeMember, updateMemberRole } = useSharing();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const memberSince = user?.created_at 
    ? format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Data não disponível';

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!' });
  };

  const handleCreateInvite = async (email: string, role: AccessRole) => {
    const token = await createInvitation(email, role);
    if (token) {
      const link = `${window.location.origin}/invite/${token}`;
      navigator.clipboard.writeText(link);
      toast({ 
        title: 'Convite criado!',
        description: 'O link foi copiado para a área de transferência.'
      });
    }
    setInviteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Informações do Perfil */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Perfil
          </CardTitle>
          <CardDescription>Seus dados de cadastro na plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 border-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 border-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Membro desde</p>
              <p className="font-medium">{memberSince}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contas Vinculadas */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Contas Vinculadas
          </CardTitle>
          <CardDescription>
            {accounts.length} conta{accounts.length !== 1 ? 's' : ''} • Saldo total: R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conta cadastrada</p>
          ) : (
            <div className="space-y-2">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-muted/50 border-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                    <span className="font-medium">{account.name}</span>
                  </div>
                  <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compartilhamento */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Compartilhamento
              </CardTitle>
              <CardDescription>Gerencie quem tem acesso aos seus dados financeiros</CardDescription>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)} size="sm">
              Convidar pessoa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <SharedMembersList 
                members={sharedMembers} 
                onRemove={removeMember}
                onUpdateRole={updateMemberRole}
              />

              {/* Convites Pendentes */}
              {invitations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Convites Pendentes
                  </h4>
                  {invitations.map(invitation => {
                    const expiresIn = Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={invitation.id} className="flex items-center justify-between p-3 bg-muted/30 border-2 border-dashed">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {roleLabels[invitation.role]} • Expira em {expiresIn} dia{expiresIn !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCopyLink(invitation.token)}
                            title="Copiar link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => cancelInvitation(invitation.id)}
                            title="Cancelar convite"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <InviteDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen}
        onInvite={handleCreateInvite}
      />
    </div>
  );
}
