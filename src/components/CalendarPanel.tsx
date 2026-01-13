import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, isBefore, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Income, Expense, Invoice, Card as CardType, Area, Category } from '@/types/finance';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Setup date-fns localizer for Portuguese
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// Create DnD Calendar
const DnDCalendar = withDragAndDrop(Calendar);

type CalendarEventType = 'expense' | 'income' | 'invoice';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: CalendarEventType;
  value: number;
  status: 'paid' | 'scheduled' | 'open' | 'closed';
  isOverdue: boolean;
  originalExpense?: Expense;
  originalIncome?: Income;
  originalInvoice?: Invoice;
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
  onUpdateExpenseDate?: (expenseId: string, newDate: Date) => void;
  onUpdateIncomeDate?: (incomeId: string, newDate: Date) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Portuguese messages for the calendar
const messages = {
  allDay: 'Dia todo',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há eventos neste período.',
  showMore: (total: number) => `+ ${total} mais`,
};

export function CalendarPanel({ 
  incomes, 
  expenses, 
  invoices, 
  cards, 
  areas = [], 
  categories = [], 
  onEditExpense, 
  onEditIncome,
  onUpdateExpenseDate,
  onUpdateIncomeDate,
}: CalendarPanelProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');

  // Convert data to calendar events
  const events = useMemo((): CalendarEvent[] => {
    const today = new Date();
    const allEvents: CalendarEvent[] = [];

    // Add incomes
    incomes.forEach((income) => {
      const date = new Date(income.date);
      allEvents.push({
        id: `income-${income.id}`,
        title: `↑ ${income.description} - ${formatCurrency(income.value)}`,
        start: date,
        end: date,
        allDay: true,
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
        title: `↓ ${expense.description} - ${formatCurrency(expense.value)}`,
        start: date,
        end: date,
        allDay: true,
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
        title: `💳 Fatura ${card.name} - ${formatCurrency(invoice.totalAmount)}`,
        start: dueDate,
        end: dueDate,
        allDay: true,
        type: 'invoice',
        value: invoice.totalAmount,
        status: invoice.status === 'paid' ? 'paid' : invoice.status,
        isOverdue,
        originalInvoice: invoice,
      });
    });

    return allEvents;
  }, [incomes, expenses, invoices, cards]);

  // Event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#6b7280'; // gray default
    let opacity = 1;

    if (event.type === 'income') {
      backgroundColor = '#22c55e'; // green
    } else if (event.type === 'expense') {
      backgroundColor = '#ef4444'; // red
      if (event.status === 'scheduled' && !event.isOverdue) {
        opacity = 0.5;
      }
    } else if (event.type === 'invoice') {
      if (event.status === 'paid') {
        backgroundColor = '#22c55e'; // green for paid
      } else if (event.status === 'closed') {
        backgroundColor = '#ef4444'; // red for closed/overdue
      } else {
        backgroundColor = '#f97316'; // orange for open
        opacity = 0.6;
      }
    }

    return {
      style: {
        backgroundColor,
        opacity,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.type === 'expense' && event.originalExpense && onEditExpense) {
      onEditExpense(event.originalExpense);
    } else if (event.type === 'income' && event.originalIncome && onEditIncome) {
      onEditIncome(event.originalIncome);
    } else if (event.type === 'invoice') {
      toast.info('Clique em "Faturas" no menu para gerenciar faturas.');
    }
  }, [onEditExpense, onEditIncome]);

  // Handle event drop (drag and drop)
  const handleEventDrop = useCallback(({ event, start }: EventInteractionArgs<CalendarEvent>) => {
    const newDate = start as Date;
    
    if (event.type === 'expense' && event.originalExpense && onUpdateExpenseDate) {
      onUpdateExpenseDate(event.originalExpense.id, newDate);
      toast.success('Data da despesa atualizada!');
    } else if (event.type === 'income' && event.originalIncome && onUpdateIncomeDate) {
      onUpdateIncomeDate(event.originalIncome.id, newDate);
      toast.success('Data da receita atualizada!');
    } else if (event.type === 'invoice') {
      toast.error('Faturas não podem ser movidas. A data é calculada automaticamente.');
    }
  }, [onUpdateExpenseDate, onUpdateIncomeDate]);

  // Handle slot selection (empty cell click)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    // Could open a new transaction dialog here
    console.log('Slot selected:', slotInfo);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Draggable accessor - only expenses and incomes can be dragged
  const draggableAccessor = useCallback((event: CalendarEvent) => {
    return event.type !== 'invoice';
  }, []);

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="border-b-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <span className="text-xl font-bold">Calendário Financeiro</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Arraste eventos para alterar datas • Clique para editar
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[600px] calendar-container">
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            date={currentDate}
            view={view}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onSelectSlot={handleSelectSlot}
            selectable
            resizable={false}
            draggableAccessor={draggableAccessor}
            eventPropGetter={eventStyleGetter}
            messages={messages}
            culture="pt-BR"
            views={['month', 'week', 'day', 'agenda']}
            popup
            popupOffset={{ x: 0, y: 0 }}
            toolbar={true}
            step={60}
            showMultiDayTimes
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span>Despesas (Pagas/Vencidas)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500 opacity-50"></div>
            <span>Despesas Agendadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span>Faturas Abertas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
