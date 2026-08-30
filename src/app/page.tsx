import { createClient } from '@/lib/supabase/server';
import { sair } from './auth/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Home provisória da migração: confirma que a sessão é lida no servidor e que
 * a RLS responde. As telas reais (Hoje, A pagar, Lançar) entram na fase 03.
 */
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: contas, error: erroContas } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Controle Financeiro</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <form action={sair}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Migração para Next.js</CardTitle>
          <CardDescription>
            Esqueleto no ar. Sessão lida no servidor, RLS ativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Contas cadastradas: </span>
            {erroContas ? (
              <span className="text-destructive">
                erro ao consultar ({erroContas.message})
              </span>
            ) : (
              <strong>{contas ?? 0}</strong>
            )}
          </p>
          <p className="text-muted-foreground">
            Próximo passo: migrations do modelo (fase 02).
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
