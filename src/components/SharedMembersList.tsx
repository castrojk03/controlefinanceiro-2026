import { SharedMember, AccessRole } from '@/hooks/useSharing';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Trash2 } from 'lucide-react';

interface SharedMembersListProps {
  members: SharedMember[];
  onRemove: (memberId: string) => void;
  onUpdateRole: (memberId: string, role: AccessRole) => void;
}

const roleLabels: Record<AccessRole, string> = {
  viewer: 'Leitor',
  editor: 'Editor',
  admin: 'Administrador'
};

export function SharedMembersList({ members, onRemove, onUpdateRole }: SharedMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma pessoa com acesso compartilhado</p>
        <p className="text-xs">Clique em "Convidar pessoa" para adicionar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Pessoas com acesso</h4>
      {members.map(member => (
        <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 border-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select 
              value={member.role} 
              onValueChange={(value) => onUpdateRole(member.member_id, value as AccessRole)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{roleLabels.viewer}</SelectItem>
                <SelectItem value="editor">{roleLabels.editor}</SelectItem>
                <SelectItem value="admin">{roleLabels.admin}</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onRemove(member.member_id)}
              title="Remover acesso"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
