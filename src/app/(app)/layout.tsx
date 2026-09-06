import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sair } from '../auth/actions';
import { Button } from '@/components/ui/button';
import { MenuLateral } from '@/components/MenuLateral';
import { LogOut } from 'lucide-react';

/**
 * Moldura das telas autenticadas: barra lateral fixa e cabeçalho.
 * O middleware já barrou quem não tem sessão; a checagem aqui é a
 * segunda linha, para o layout nunca renderizar sem usuário.
 */
export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  return (
    <div className="flex min-h-screen bg-background">
      <MenuLateral />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b px-6">
          <Link href="/" className="font-semibold tracking-tight">
            Controle Financeiro
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <form action={sair}>
              <Button type="submit" variant="ghost" size="icon" title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
