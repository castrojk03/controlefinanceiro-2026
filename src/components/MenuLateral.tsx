'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  List,
  Gauge,
  Table,
  CalendarDays,
  Calendar,
  Receipt,
  Calculator,
  BarChart3,
  Settings,
} from 'lucide-react';

/**
 * As dez telas definidas no planejamento. A ordem vai do uso diário
 * (Início, Lançamentos) para o aprofundamento (Relatórios), com
 * Configurações no fim.
 */
const TELAS = [
  { href: '/', rotulo: 'Início', Icone: Home },
  { href: '/lancamentos', rotulo: 'Lançamentos', Icone: List },
  { href: '/limites', rotulo: 'Limites', Icone: Gauge },
  { href: '/painel-geral', rotulo: 'Painel Geral', Icone: Table },
  { href: '/painel-diario', rotulo: 'Painel Diário', Icone: CalendarDays },
  { href: '/calendario', rotulo: 'Calendário', Icone: Calendar },
  { href: '/faturas', rotulo: 'Faturas', Icone: Receipt },
  { href: '/simulacao', rotulo: 'Simulação', Icone: Calculator },
  { href: '/relatorios', rotulo: 'Relatórios', Icone: BarChart3 },
  { href: '/configuracoes', rotulo: 'Configurações', Icone: Settings },
] as const;

export function MenuLateral() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-52 shrink-0 border-r bg-muted/30 p-3 md:block"
    >
      <ul className="flex flex-col gap-0.5">
        {TELAS.map(({ href, rotulo, Icone }) => {
          const ativo = href === '/' ? caminho === '/' : caminho.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  ativo
                    ? 'bg-background font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                )}
              >
                <Icone className="h-4 w-4 shrink-0" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
