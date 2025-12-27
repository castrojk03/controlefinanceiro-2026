import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Income, Expense, Area } from '@/types/finance';

interface ReportsPanelProps {
  incomes: Income[];
  expenses: Expense[];
  areas: Area[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  selectedMonth: number;
  selectedYear: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const COLORS = [
  'hsl(12, 76%, 61%)',
  'hsl(173, 58%, 39%)',
  'hsl(197, 37%, 24%)',
  'hsl(43, 74%, 66%)',
  'hsl(27, 87%, 67%)',
  'hsl(200, 70%, 50%)',
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ReportsPanel({
  incomes,
  expenses,
  areas,
  totalIncome,
  totalExpense,
  balance,
  selectedMonth,
  selectedYear,
}: ReportsPanelProps) {
  // Expenses by Area
  const expensesByArea = areas.map((area, index) => {
    const areaExpenses = expenses.filter(e => e.areaId === area.id);
    const total = areaExpenses.reduce((acc, e) => acc + e.value, 0);
    return {
      name: area.name,
      value: total,
      color: COLORS[index % COLORS.length],
    };
  }).filter(item => item.value > 0);

  // Expenses by Type
  const expensesByType = [
    { name: 'Fixo', value: expenses.filter(e => e.type === 'Fixo').reduce((acc, e) => acc + e.value, 0), color: 'hsl(var(--chart-1))' },
    { name: 'Variável', value: expenses.filter(e => e.type === 'Variável').reduce((acc, e) => acc + e.value, 0), color: 'hsl(var(--chart-2))' },
    { name: 'Sazonal', value: expenses.filter(e => e.type === 'Sazonal').reduce((acc, e) => acc + e.value, 0), color: 'hsl(var(--chart-4))' },
  ].filter(item => item.value > 0);

  // Income vs Expense
  const comparisonData = [
    { name: 'Receitas', value: totalIncome, fill: 'hsl(173, 58%, 39%)' },
    { name: 'Despesas', value: totalExpense, fill: 'hsl(0, 84%, 60%)' },
  ];

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-muted-foreground">
          Análise financeira de {MONTHS[selectedMonth]} de {selectedYear}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Financial Summary */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="border-b-2 pb-4">
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 pb-4">
                <span className="font-medium">Total de Receitas</span>
                <span className="text-xl font-bold text-chart-2">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between border-b-2 pb-4">
                <span className="font-medium">Total de Despesas</span>
                <span className="text-xl font-bold text-destructive">{formatCurrency(totalExpense)}</span>
              </div>
              <div className="flex items-center justify-between border-b-2 pb-4">
                <span className="font-medium">Saldo do Mês</span>
                <span className={`text-xl font-bold ${balance >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Taxa de Economia</span>
                <span className={`text-xl font-bold ${savingsRate >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {savingsRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income vs Expense Chart */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="border-b-2 pb-4">
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData} layout="vertical">
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    border: '2px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expenses by Area */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="border-b-2 pb-4">
            <CardTitle>Despesas por Área</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {expensesByArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expensesByArea}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expensesByArea.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      border: '2px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Sem despesas neste período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Type */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="border-b-2 pb-4">
            <CardTitle>Despesas por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {expensesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expensesByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expensesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      border: '2px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Sem despesas neste período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Indicator */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="border-b-2 pb-4">
          <CardTitle>Saúde Financeira</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-4 flex-1 border-2 bg-secondary">
                <div 
                  className={`h-full transition-all ${savingsRate >= 20 ? 'bg-chart-2' : savingsRate >= 0 ? 'bg-chart-4' : 'bg-destructive'}`}
                  style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono font-bold">{savingsRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {savingsRate >= 20 
                  ? '✓ Excelente! Você está economizando mais de 20% da renda.'
                  : savingsRate >= 10
                  ? '⚠ Bom, mas tente aumentar a taxa de economia para 20%.'
                  : savingsRate >= 0
                  ? '⚠ Atenção: economize pelo menos 10% da sua renda.'
                  : '✗ Alerta: suas despesas excedem suas receitas!'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
