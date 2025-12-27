import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DailyBalance } from '@/types/finance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyPanelProps {
  dailyBalances: DailyBalance[];
  selectedMonth: number;
  selectedYear: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatCurrency = (value: number) => {
  if (value === 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function DailyPanel({ dailyBalances, selectedMonth, selectedYear }: DailyPanelProps) {
  const totalIncome = dailyBalances.reduce((acc, d) => acc + d.income, 0);
  const totalExpense = dailyBalances.reduce((acc, d) => acc + d.expense, 0);
  const finalBalance = dailyBalances[dailyBalances.length - 1]?.balance ?? 0;

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="border-b-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl font-bold">Painel Diário</span>
          <span className="text-sm font-normal text-muted-foreground">
            • {MONTHS[selectedMonth]} {selectedYear}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="border-b-2 hover:bg-transparent">
                <TableHead className="w-[150px] border-r-2 font-bold">Data</TableHead>
                <TableHead className="w-[150px] border-r text-right font-bold text-chart-2">Entrada</TableHead>
                <TableHead className="w-[150px] border-r text-right font-bold text-destructive">Saída</TableHead>
                <TableHead className="w-[150px] text-right font-bold">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyBalances.map((day, index) => {
                const hasActivity = day.income > 0 || day.expense > 0;
                return (
                  <TableRow 
                    key={index} 
                    className={`border-b ${hasActivity ? 'bg-secondary/20' : ''} hover:bg-secondary/40`}
                  >
                    <TableCell className="border-r-2 font-medium">
                      <div className="flex flex-col">
                        <span>{format(day.date, 'dd/MM/yyyy')}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(day.date, 'EEEE', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`border-r text-right font-mono ${day.income > 0 ? 'text-chart-2' : 'text-muted-foreground'}`}>
                      {formatCurrency(day.income)}
                    </TableCell>
                    <TableCell className={`border-r text-right font-mono ${day.expense > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formatCurrency(day.expense)}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-medium ${day.balance >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                      {formatCurrency(day.balance)}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Total Row */}
              <TableRow className="border-t-2 bg-primary/5 font-bold hover:bg-primary/10">
                <TableCell className="border-r-2 font-bold">TOTAL</TableCell>
                <TableCell className="border-r text-right font-mono text-chart-2">
                  {formatCurrency(totalIncome)}
                </TableCell>
                <TableCell className="border-r text-right font-mono text-destructive">
                  {formatCurrency(totalExpense)}
                </TableCell>
                <TableCell className={`text-right font-mono ${finalBalance >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {formatCurrency(finalBalance)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
