'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  List,
  CalendarClock,
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
  { href: '/', rotulo: 'Início', Icone: Home, pronta: true },
  { href: '/lancamentos', rotulo: 'Lançamentos', Icone: List, pronta: true },
  { href: '/recorrentes', rotulo: 'Recorrentes', Icone: CalendarClock, pronta: true },
  { href: '/limites', rotulo: 'Limites', Icone: Gauge, pronta: false },
  { href: '/painel-geral', rotulo: 'Painel Geral', Icone: Table, pronta: false },
  { href: '/painel-diario', rotulo: 'Painel Diário', Icone: CalendarDays, pronta: false },
  { href: '/calendario', rotulo: 'Calendário', Icone: Calendar, pronta: false },
  { href: '/faturas', rotulo: 'Faturas', Icone: Receipt, pronta: false },
  { href: '/simulacao', rotulo: 'Simulação', Icone: Calculator, pronta: false },
  { href: '/relatorios', rotulo: 'Relatórios', Icone: BarChart3, pronta: false },
  { href: '/configuracoes', rotulo: 'Configurações', Icone: Settings, pronta: true },
] as const;

export function MenuLateral() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="w-full shrink-0 overflow-x-auto border-b bg-muted/30 p-3 md:w-52 md:overflow-visible md:border-b-0 md:border-r"
    >
      <ul className="flex flex-row gap-0.5 md:flex-col">
        {TELAS.map(({ href, rotulo, Icone, pronta }) => {
          const ativo = href === '/' ? caminho === '/' : caminho.startsWith(href);

          // Tela ainda não construída: aparece no menu para mostrar o plano,
          // mas não navega — clicar e cair num 404 é pior que não clicar.
          if (!pronta) {
            return (
              <li key={href}>
                <span
                  aria-disabled="true"
                  title="Ainda não construída"
                  className="flex cursor-not-allowed items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground/45"
                >
                  <Icone className="h-4 w-4 shrink-0" />
                  {rotulo}
                </span>
              </li>
            );
          }

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
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
