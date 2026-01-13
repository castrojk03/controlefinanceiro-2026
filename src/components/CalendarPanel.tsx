import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Income, Expense, Invoice, Card as CardType, Area, Category } from '@/types/finance';
import { ChevronLeft, ChevronRight, CalendarDays, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  addYears,
  subMonths,
  subWeeks,
  subYears,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfYear,
  getDay,
  getDaysInMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewMode = 'day' | 'week' | 'month' | 'year';

type CalendarEventType = 'expense' | 'income' | 'invoice';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: CalendarEventType;
  value: number;
  status: 'paid' | 'scheduled' | 'open' | 'closed';
  isOverdue: boolean;
  originalExpense?: Expense;
  originalIncome?: Income;
}

interface CalendarPanelProps {
  incomes: Income[];
  expenses: Expense[];
  invoices: Invoice[];
  cards: CardType[];
  areas?: Area[];
  categories?: Category[];
  onEditExpense?: (expense: Expense) => void;
  onEditIncome?: (income: Income) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function CalendarPanel({ incomes, expenses, invoices, cards, areas = [], categories = [], onEditExpense, onEditIncome }: CalendarPanelProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Convert data to calendar events
  const events = useMemo((): CalendarEvent[] => {
    const today = new Date();
    const allEvents: CalendarEvent[] = [];

    // Add incomes
    incomes.forEach((income) => {
      const date = new Date(income.date);
      allEvents.push({
        id: `income-${income.id}`,
        title: income.description,
        date,
        type: 'income',
        value: income.value,
        status: 'paid',
        isOverdue: false,
        originalIncome: income,
      });
    });

    // Add expenses
    expenses.forEach((expense) => {
      const date = expense.paymentDate ? new Date(expense.paymentDate) : new Date(expense.date);
      const isOverdue = expense.status === 'scheduled' && (isBefore(date, today) || isSameDay(date, today));
      allEvents.push({
        id: `expense-${expense.id}`,
        title: expense.description,
        date,
        type: 'expense',
        value: expense.value,
        status: expense.status,
        isOverdue,
        originalExpense: expense,
      });
    });

    // Add invoices
    invoices.forEach((invoice) => {
      const card = cards.find((c) => c.id === invoice.cardId);
      if (!card) return;

      const dueDate = new Date(invoice.year, invoice.month, card.dueDay);
      const isOverdue = invoice.status !== 'paid' && (isBefore(dueDate, today) || isSameDay(dueDate, today));
      
      allEvents.push({
        id: `invoice-${invoice.id}`,
        title: `Fatura ${card.name}`,
        date: dueDate,
        type: 'invoice',
        value: invoice.totalAmount,
        status: invoice.status === 'paid' ? 'paid' : invoice.status,
        isOverdue,
      });
    });

    return allEvents;
  }, [incomes, expenses, invoices, cards]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  // Get event color based on type and status
  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'income') {
      return 'bg-green-500';
    }
    if (event.type === 'expense') {
      return 'bg-red-500';
    }
    if (event.type === 'invoice') {
      if (event.status === 'closed') {
        return 'bg-red-500';
      }
      return 'bg-orange-500';
    }
    return 'bg-muted';
  };

  // Get event opacity based on status
  const getEventOpacity = (event: CalendarEvent) => {
    if (event.status === 'paid') return 'opacity-100';
    if (event.status === 'scheduled') {
      return event.isOverdue ? 'opacity-100' : 'opacity-50';
    }
    if (event.status === 'closed') return 'opacity-100';
    if (event.status === 'open') return 'opacity-50';
    return 'opacity-100';
  };

  // Navigation
  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate((prev) => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => (direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)));
    } else if (viewMode === 'month') {
      setCurrentDate((prev) => (direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)));
    } else if (viewMode === 'year') {
      setCurrentDate((prev) => (direction === 'next' ? addYears(prev, 1) : subYears(prev, 1)));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get title based on view mode
  const getTitle = () => {
    if (viewMode === 'day') {
      return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'dd MMM', { locale: ptBR })} - ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
    }
    if (viewMode === 'month') {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
    return format(currentDate, 'yyyy');
  };

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const weeks: Date[][] = [];
    let days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(day);
        day = addDays(day, 1);
      }
      weeks.push(days);
      days = [];
    }

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="flex-1">
        {/* Week header */}
        <div className="grid grid-cols-7 border-b-2">
          {weekDays.map((dayName) => (
            <div key={dayName} className="p-2 text-center text-sm font-medium text-muted-foreground border-r-2 last:border-r-0">
              {dayName}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b-2 last:border-b-0">
              {week.map((dayDate, dayIndex) => {
                const dayEvents = getEventsForDate(dayDate);
                const isCurrentMonth = isSameMonth(dayDate, currentDate);
                const isTodayDate = isToday(dayDate);

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      'min-h-[100px] p-1 border-r-2 last:border-r-0',
                      !isCurrentMonth && 'bg-muted/30',
                      isTodayDate && 'bg-accent/20'
                    )}
                  >
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      !isCurrentMonth && 'text-muted-foreground',
                      isTodayDate && 'text-primary font-bold'
                    )}>
                      {format(dayDate, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs px-1 py-0.5 rounded truncate text-white flex items-center gap-1',
                            getEventColor(event),
                            getEventOpacity(event),
                            event.type === 'expense' && onEditExpense && 'cursor-pointer hover:ring-1 hover:ring-white'
                          )}
                          title={`${event.title} - ${formatCurrency(event.value)}`}
                          onClick={() => {
                            if (event.type === 'expense' && event.originalExpense && onEditExpense) {
                              onEditExpense(event.originalExpense);
                            }
                          }}
                        >
                          {event.type === 'expense' && onEditExpense && <Pencil className="h-2 w-2 flex-shrink-0" />}
                          <span className="truncate">{formatCurrency(event.value)}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }

    return (
      <div className="flex-1">
        <div className="grid grid-cols-7 h-full">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isTodayDate = isToday(day);

            return (
              <div key={index} className={cn(
                'border-r-2 last:border-r-0 p-2',
                isTodayDate && 'bg-accent/20'
              )}>
                <div className={cn(
                  'text-center mb-2 pb-2 border-b-2',
                  isTodayDate && 'text-primary font-bold'
                )}>
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-lg font-medium">
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs p-1 rounded text-white',
                        getEventColor(event),
                        getEventOpacity(event)
                      )}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div>{formatCurrency(event.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isTodayDate = isToday(currentDate);

    const groupedEvents = {
      income: dayEvents.filter((e) => e.type === 'income'),
      expense: dayEvents.filter((e) => e.type === 'expense'),
      invoice: dayEvents.filter((e) => e.type === 'invoice'),
    };

    return (
      <div className="flex-1 p-4 space-y-4">
        <div className={cn(
          'text-center text-xl font-medium',
          isTodayDate && 'text-primary'
        )}>
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </div>

        {dayEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum evento neste dia
          </div>
        ) : (
          <div className="space-y-4">
            {groupedEvents.income.length > 0 && (
              <div>
                <h3 className="font-medium text-green-600 mb-2">Receitas</h3>
                <div className="space-y-2">
                  {groupedEvents.income.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'p-3 rounded border-2 border-l-4 border-l-green-500',
                        getEventOpacity(event),
                        event.originalIncome && onEditIncome && 'cursor-pointer hover:bg-secondary/50'
                      )}
                      onClick={() => {
                        if (event.originalIncome && onEditIncome) {
                          onEditIncome(event.originalIncome);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{event.title}</div>
                        {event.originalIncome && onEditIncome && (
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-green-600">{formatCurrency(event.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedEvents.expense.length > 0 && (
              <div>
                <h3 className="font-medium text-red-600 mb-2">Despesas</h3>
                <div className="space-y-2">
                  {groupedEvents.expense.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'p-3 rounded border-2 border-l-4 border-l-red-500',
                        getEventOpacity(event),
                        event.originalExpense && onEditExpense && 'cursor-pointer hover:bg-secondary/50'
                      )}
                      onClick={() => {
                        if (event.originalExpense && onEditExpense) {
                          onEditExpense(event.originalExpense);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{event.title}</div>
                          {event.originalExpense && onEditExpense && (
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          event.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        )}>
                          {event.status === 'paid' ? 'PAGO' : 'AGENDADO'}
                        </div>
                      </div>
                      <div className="text-red-600">{formatCurrency(event.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedEvents.invoice.length > 0 && (
              <div>
                <h3 className="font-medium text-orange-600 mb-2">Faturas</h3>
                <div className="space-y-2">
                  {groupedEvents.invoice.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'p-3 rounded border-2 border-l-4',
                        event.status === 'closed' ? 'border-l-red-500' : 'border-l-orange-500',
                        getEventOpacity(event)
                      )}
                    >
                      <div className="flex justify-between">
                        <div className="font-medium">{event.title}</div>
                        <div className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          event.status === 'paid' ? 'bg-green-100 text-green-800' :
                          event.status === 'closed' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        )}>
                          {event.status === 'paid' ? 'PAGA' : event.status === 'closed' ? 'FECHADA' : 'ABERTA'}
                        </div>
                      </div>
                      <div className={event.status === 'closed' ? 'text-red-600' : 'text-orange-600'}>
                        {formatCurrency(event.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render year view
  const renderYearView = () => {
    const months = [];
    const yearStart = startOfYear(currentDate);

    for (let i = 0; i < 12; i++) {
      months.push(addMonths(yearStart, i));
    }

    return (
      <div className="flex-1 p-4">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {months.map((monthDate, index) => {
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
            
            // Count events in this month
            const monthEvents = events.filter((e) => isSameMonth(e.date, monthDate));
            const hasIncome = monthEvents.some((e) => e.type === 'income');
            const hasExpense = monthEvents.some((e) => e.type === 'expense');
            const hasInvoice = monthEvents.some((e) => e.type === 'invoice');

            // Generate mini calendar
            const weeks: Date[][] = [];
            let days: Date[] = [];
            let day = startDate;
            const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

            while (day <= endDate) {
              for (let j = 0; j < 7; j++) {
                days.push(day);
                day = addDays(day, 1);
              }
              weeks.push(days);
              days = [];
            }

            return (
              <div
                key={index}
                className="border-2 rounded p-2 cursor-pointer hover:bg-accent/20 transition-colors"
                onClick={() => {
                  setCurrentDate(monthDate);
                  setViewMode('month');
                }}
              >
                <div className="text-sm font-medium mb-2 capitalize">
                  {format(monthDate, 'MMMM', { locale: ptBR })}
                </div>
                
                {/* Mini calendar grid */}
                <div className="text-[8px]">
                  {weeks.slice(0, 5).map((week, weekIndex) => (
                    <div key={weekIndex} className="flex">
                      {week.map((dayDate, dayIndex) => {
                        const dayEvents = getEventsForDate(dayDate);
                        const isCurrentMonth = isSameMonth(dayDate, monthDate);
                        const hasEvents = dayEvents.length > 0;

                        return (
                          <div
                            key={dayIndex}
                            className={cn(
                              'w-3 h-3 flex items-center justify-center',
                              !isCurrentMonth && 'text-muted-foreground/30',
                              hasEvents && 'font-bold'
                            )}
                          >
                            {hasEvents ? (
                              <div className={cn(
                                'w-2 h-2 rounded-full',
                                dayEvents.some(e => e.type === 'expense') ? 'bg-red-500' :
                                dayEvents.some(e => e.type === 'income') ? 'bg-green-500' :
                                'bg-orange-500'
                              )} />
                            ) : (
                              isCurrentMonth && format(dayDate, 'd').length === 1 ? format(dayDate, 'd') : ''
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex gap-1 mt-2">
                  {hasIncome && <div className="w-2 h-2 rounded-full bg-green-500" />}
                  {hasExpense && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  {hasInvoice && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendário Financeiro
          </CardTitle>

          {/* View mode selector */}
          <div className="flex gap-1 border-2 rounded p-1">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="text-xs"
              >
                {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : mode === 'month' ? 'Mês' : 'Ano'}
              </Button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
          </div>
          <div className="text-lg font-medium capitalize">
            {getTitle()}
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Receitas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Despesas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span>Faturas</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col min-h-[500px]">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'year' && renderYearView()}
        </div>
      </CardContent>
    </Card>
  );
}
