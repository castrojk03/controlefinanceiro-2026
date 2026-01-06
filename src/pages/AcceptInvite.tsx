import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { UserPlus, CheckCircle, XCircle, LogIn } from 'lucide-react';

type AccessRole = 'viewer' | 'editor' | 'admin';

interface InvitationData {
  id: string;
  owner_id: string;
  email: string;
  role: AccessRole;
  expires_at: string;
  owner_email?: string;
}

const roleLabels: Record<AccessRole, string> = {
  viewer: 'Leitor',
  editor: 'Editor',
  admin: 'Administrador'
};

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Token de convite inválido');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      if (fetchError || !data) {
        setError('Convite não encontrado ou já foi utilizado');
        setLoading(false);
        return;
      }

      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setError('Este convite expirou');
        setLoading(false);
        return;
      }

      // Fetch owner email
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', data.owner_id)
        .single();

      setInvitation({
        ...data,
        role: data.role as AccessRole,
        owner_email: ownerProfile?.email || 'Usuário'
      });
      setEmail(data.email);
      setLoading(false);
    };

    fetchInvitation();
  }, [token]);

  useEffect(() => {
    if (user && invitation) {
      acceptInvitation();
    }
  }, [user, invitation]);

  const acceptInvitation = async () => {
    if (!user || !invitation) return;

    // Check if user email matches invitation
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      setError(`Este convite foi enviado para ${invitation.email}. Você está logado como ${user.email}.`);
      return;
    }

    // Create shared_members entry
    const { error: shareError } = await supabase
      .from('shared_members')
      .insert({
        owner_id: invitation.owner_id,
        member_id: user.id,
        role: invitation.role
      });

    if (shareError) {
      if (shareError.code === '23505') {
        toast({ title: 'Você já tem acesso a esses dados' });
      } else {
        toast({
          title: 'Erro ao aceitar convite',
          description: shareError.message,
          variant: 'destructive'
        });
        return;
      }
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    toast({ title: 'Convite aceito com sucesso!' });
    navigate('/');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = isLogin 
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast({
        title: isLogin ? 'Erro no login' : 'Erro no cadastro',
        description: error.message,
        variant: 'destructive'
      });
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  // User is logged in but with different email
  if (user && user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Email Incorreto</CardTitle>
            <CardDescription>
              Este convite foi enviado para <strong>{invitation.email}</strong>.
              <br />
              Você está logado como <strong>{user.email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline" onClick={() => supabase.auth.signOut()}>
              Sair e usar outra conta
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => navigate('/')}>
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User needs to login/signup
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle>Você foi convidado!</CardTitle>
          <CardDescription>
            <strong>{invitation.owner_email}</strong> quer compartilhar dados financeiros com você como <strong>{roleLabels[invitation.role]}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!invitation.email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? 'Sua senha' : 'Crie uma senha'}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LogIn className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Aguarde...' : isLogin ? 'Entrar e Aceitar' : 'Criar Conta e Aceitar'}
            </Button>
            <Button 
              type="button" 
              variant="link" 
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
