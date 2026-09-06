import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, CreditCard, CalendarClock, Gauge } from 'lucide-react';

/**
 * Início. Por enquanto mostra o que ainda falta configurar — o aviso
 * definido no fluxo 9. Os quatro números e o bloco "próximos 7 dias"
 * entram quando houver contas e lançamentos para somar.
 */
export default async function PaginaInicio() {
  const supabase = await createClient();

  const [contas, cartoes, recorrencias, limites] = await Promise.all([
    supabase.from('accounts').select('id', { count: 'exact', head: true }),
    supabase.from('cards').select('id', { count: 'exact', head: true }),
    supabase.from('recorrencias').select('id', { count: 'exact', head: true }),
    supabase.from('limites').select('id', { count: 'exact', head: true }),
  ]);

  const passos = [
    {
      Icone: Wallet,
      rotulo: 'Contas bancárias',
      total: contas.count ?? 0,
      nota: 'Onde o dinheiro fica.',
      disponivel: true,
      destino: '/configuracoes',
    },
    {
      Icone: CreditCard,
      rotulo: 'Cartões',
      total: cartoes.count ?? 0,
      nota: 'Fechamento e vencimento permitem prever a fatura.',
      disponivel: true,
      destino: '/configuracoes',
    },
    {
      Icone: CalendarClock,
      rotulo: 'Contas recorrentes',
      total: recorrencias.count ?? 0,
      nota: 'Sem elas, o bloco "próximos 7 dias" fica vazio.',
      disponivel: true,
      destino: '/recorrentes',
    },
    {
      Icone: Gauge,
      rotulo: 'Limites por área',
      total: limites.count ?? 0,
      nota: 'Referência de gastos, não trava.',
      disponivel: false,
      destino: '/limites',
    },
  ];

  // Só cobra o que já dá para fazer — pedir sem oferecer o caminho é
  // interface mentindo.
  const faltando = passos.filter((p) => p.disponivel && p.total === 0);
  const emConstrucao = passos.filter((p) => !p.disponivel);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Início</h1>
        <p className="text-muted-foreground">
          Quanto você tem e o que vem pela frente.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {faltando.length > 0 ? 'Falta configurar' : 'Configuração em dia'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {faltando.length > 0
              ? 'O app começa a responder assim que houver contas e compromissos cadastrados.'
              : 'Contas e cartões cadastrados. O resto vem nas próximas etapas.'}
          </p>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {passos
              .filter((p) => p.disponivel)
              .map(({ Icone, rotulo, total, nota, destino }) => (
                <li key={rotulo}>
                  <Link
                    href={destino}
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icone
                      className={
                        total > 0
                          ? 'h-4 w-4 shrink-0 text-foreground'
                          : 'h-4 w-4 shrink-0 text-muted-foreground'
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{rotulo}</p>
                      <p className="text-sm text-muted-foreground">{nota}</p>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {total > 0 ? `${total} cadastrado(s)` : 'cadastrar'}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      {emConstrucao.length > 0 && (
        <Card className="mt-4 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Ainda em construção</CardTitle>
            <p className="text-sm text-muted-foreground">
              Estas telas fazem parte do plano, mas ainda não existem.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {emConstrucao.map(({ Icone, rotulo, nota }) => (
                <li key={rotulo} className="flex items-center gap-3 py-3">
                  <Icone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-muted-foreground">{rotulo}</p>
                    <p className="text-sm text-muted-foreground">{nota}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">em breve</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
