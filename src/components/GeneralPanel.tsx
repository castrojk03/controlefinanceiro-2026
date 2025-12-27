import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface GeneralPanelProps {
  incomesByOrigin: Record<string, number[]>;
  expensesByArea: Record<string, { total: number[]; categories: Record<string, number[]> }>;
  selectedYear: number;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (value: number) => {
  if (value === 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function GeneralPanel({ incomesByOrigin, expensesByArea, selectedYear }: GeneralPanelProps) {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const toggleArea = (area: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(area)) {
      newExpanded.delete(area);
    } else {
      newExpanded.add(area);
    }
    setExpandedAreas(newExpanded);
  };

  const monthlyTotals = useMemo(() => {
    const incomes = Array(12).fill(0);
    const expenses = Array(12).fill(0);

    Object.values(incomesByOrigin).forEach(values => {
      values.forEach((value, index) => {
        incomes[index] += value;
      });
    });

    Object.values(expensesByArea).forEach(area => {
      area.total.forEach((value, index) => {
        expenses[index] += value;
      });
    });

    return { incomes, expenses };
  }, [incomesByOrigin, expensesByArea]);

  const totalIncome = monthlyTotals.incomes.reduce((a, b) => a + b, 0);
  const totalExpense = monthlyTotals.expenses.reduce((a, b) => a + b, 0);

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="border-b-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl font-bold">Painel Geral</span>
          <span className="text-sm font-normal text-muted-foreground">• {selectedYear}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 hover:bg-transparent">
                <TableHead className="w-[200px] border-r-2 font-bold">Descrição</TableHead>
                <TableHead className="w-[80px] border-r font-bold">Tipo</TableHead>
                {MONTHS_SHORT.map((month) => (
                  <TableHead key={month} className="w-[80px] border-r text-center font-bold">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="w-[100px] text-center font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* RECEITAS */}
              <TableRow className="border-b-2 bg-chart-2/10 hover:bg-chart-2/20">
                <TableCell colSpan={15} className="font-bold text-chart-2">
                  RECEITAS
                </TableCell>
              </TableRow>
              
              {Object.entries(incomesByOrigin).map(([origin, values]) => (
                <TableRow key={origin} className="border-b hover:bg-secondary/50">
                  <TableCell className="border-r-2 font-medium">{origin}</TableCell>
                  <TableCell className="border-r text-xs text-muted-foreground">Variável</TableCell>
                  {values.map((value, index) => (
                    <TableCell key={index} className="border-r text-center font-mono text-sm">
                      {formatCurrency(value)}
                    </TableCell>
                  ))}
                  <TableCell className="bg-secondary/30 text-center font-mono font-bold">
                    {formatCurrency(values.reduce((a, b) => a + b, 0))}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="border-b-2 bg-chart-2/5 hover:bg-chart-2/10">
                <TableCell className="border-r-2 font-bold">Total Receitas</TableCell>
                <TableCell className="border-r"></TableCell>
                {monthlyTotals.incomes.map((value, index) => (
                  <TableCell key={index} className="border-r text-center font-mono font-bold text-chart-2">
                    {formatCurrency(value)}
                  </TableCell>
                ))}
                <TableCell className="bg-chart-2/20 text-center font-mono font-bold text-chart-2">
                  {formatCurrency(totalIncome)}
                </TableCell>
              </TableRow>

              {/* DESPESAS */}
              <TableRow className="border-b-2 bg-destructive/10 hover:bg-destructive/20">
                <TableCell colSpan={15} className="font-bold text-destructive">
                  DESPESAS
                </TableCell>
              </TableRow>

              {Object.entries(expensesByArea).map(([area, data]) => (
                <>
                  <TableRow 
                    key={area} 
                    className="cursor-pointer border-b bg-secondary/30 hover:bg-secondary/50"
                    onClick={() => toggleArea(area)}
                  >
                    <TableCell className="border-r-2 font-bold">
                      <div className="flex items-center gap-2">
                        {expandedAreas.has(area) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {area}
                      </div>
                    </TableCell>
                    <TableCell className="border-r"></TableCell>
                    {data.total.map((value, index) => (
                      <TableCell key={index} className="border-r text-center font-mono text-sm font-medium">
                        {formatCurrency(value)}
                      </TableCell>
                    ))}
                    <TableCell className="bg-secondary/50 text-center font-mono font-bold">
                      {formatCurrency(data.total.reduce((a, b) => a + b, 0))}
                    </TableCell>
                  </TableRow>

                  {expandedAreas.has(area) && Object.entries(data.categories).map(([category, values]) => (
                    <TableRow key={`${area}-${category}`} className="border-b hover:bg-secondary/30">
                      <TableCell className="border-r-2 pl-8 text-muted-foreground">{category}</TableCell>
                      <TableCell className="border-r text-xs text-muted-foreground">-</TableCell>
                      {values.map((value, index) => (
                        <TableCell key={index} className="border-r text-center font-mono text-sm text-muted-foreground">
                          {formatCurrency(value)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-mono text-sm text-muted-foreground">
                        {formatCurrency(values.reduce((a, b) => a + b, 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}

              <TableRow className="border-b-2 bg-destructive/5 hover:bg-destructive/10">
                <TableCell className="border-r-2 font-bold">Total Despesas</TableCell>
                <TableCell className="border-r"></TableCell>
                {monthlyTotals.expenses.map((value, index) => (
                  <TableCell key={index} className="border-r text-center font-mono font-bold text-destructive">
                    {formatCurrency(value)}
                  </TableCell>
                ))}
                <TableCell className="bg-destructive/20 text-center font-mono font-bold text-destructive">
                  {formatCurrency(totalExpense)}
                </TableCell>
              </TableRow>

              {/* SALDO */}
              <TableRow className="border-b-2 bg-primary/5 hover:bg-primary/10">
                <TableCell className="border-r-2 font-bold">SALDO</TableCell>
                <TableCell className="border-r"></TableCell>
                {monthlyTotals.incomes.map((income, index) => {
                  const balance = income - monthlyTotals.expenses[index];
                  return (
                    <TableCell 
                      key={index} 
                      className={`border-r text-center font-mono font-bold ${balance >= 0 ? 'text-chart-2' : 'text-destructive'}`}
                    >
                      {formatCurrency(balance)}
                    </TableCell>
                  );
                })}
                <TableCell className={`bg-primary/10 text-center font-mono font-bold ${totalIncome - totalExpense >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {formatCurrency(totalIncome - totalExpense)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
