import { Account, Card, Area, Category, Income, Expense } from '@/types/finance';

export const mockAccounts: Account[] = [
  { id: '1', name: 'Conta Principal', balance: 15000, color: 'hsl(var(--chart-1))' },
  { id: '2', name: 'Conta Reserva', balance: 5000, color: 'hsl(var(--chart-2))' },
  { id: '3', name: 'Investimentos', balance: 25000, color: 'hsl(var(--chart-3))' },
];

export const mockCards: Card[] = [
  { id: '1', name: 'Nubank', type: 'Crédito', lastDigits: '4521', color: 'hsl(280 80% 60%)', accountId: '1' },
  { id: '2', name: 'Itaú', type: 'Débito', lastDigits: '8832', color: 'hsl(30 80% 50%)', accountId: '1' },
  { id: '3', name: 'Inter', type: 'Crédito', lastDigits: '1192', color: 'hsl(15 80% 55%)', accountId: '2' },
];

export const mockAreas: Area[] = [
  { id: '1', name: 'Moradia', color: 'hsl(var(--chart-1))' },
  { id: '2', name: 'Alimentação', color: 'hsl(var(--chart-2))' },
  { id: '3', name: 'Transporte', color: 'hsl(var(--chart-3))' },
  { id: '4', name: 'Saúde', color: 'hsl(var(--chart-4))' },
  { id: '5', name: 'Lazer', color: 'hsl(var(--chart-5))' },
  { id: '6', name: 'Educação', color: 'hsl(200 70% 50%)' },
];

export const mockCategories: Category[] = [
  { id: '1', name: 'Aluguel', areaId: '1' },
  { id: '2', name: 'Condomínio', areaId: '1' },
  { id: '3', name: 'Energia', areaId: '1' },
  { id: '4', name: 'Água', areaId: '1' },
  { id: '5', name: 'Supermercado', areaId: '2' },
  { id: '6', name: 'Restaurantes', areaId: '2' },
  { id: '7', name: 'Delivery', areaId: '2' },
  { id: '8', name: 'Combustível', areaId: '3' },
  { id: '9', name: 'IPVA', areaId: '3' },
  { id: '10', name: 'Manutenção', areaId: '3' },
  { id: '11', name: 'Plano de Saúde', areaId: '4' },
  { id: '12', name: 'Medicamentos', areaId: '4' },
  { id: '13', name: 'Cinema', areaId: '5' },
  { id: '14', name: 'Streaming', areaId: '5' },
  { id: '15', name: 'Cursos', areaId: '6' },
];

const currentYear = 2025;

export const mockIncomes: Income[] = [
  // Janeiro
  { id: '1', description: 'Salário', type: 'Fixo', value: 12000, date: new Date(currentYear, 0, 5), origin: 'Empresa ABC', accountId: '1' },
  { id: '2', description: 'Freelance', type: 'Variável', value: 2500, date: new Date(currentYear, 0, 15), origin: 'Cliente X', accountId: '1' },
  { id: '3', description: '13º Salário', type: 'Sazonal', value: 6000, date: new Date(currentYear, 0, 20), origin: 'Empresa ABC', accountId: '2' },
  // Fevereiro
  { id: '4', description: 'Salário', type: 'Fixo', value: 12000, date: new Date(currentYear, 1, 5), origin: 'Empresa ABC', accountId: '1' },
  { id: '5', description: 'Freelance', type: 'Variável', value: 1800, date: new Date(currentYear, 1, 18), origin: 'Cliente Y', accountId: '1' },
  // Março
  { id: '6', description: 'Salário', type: 'Fixo', value: 12000, date: new Date(currentYear, 2, 5), origin: 'Empresa ABC', accountId: '1' },
  { id: '7', description: 'Dividendos', type: 'Variável', value: 850, date: new Date(currentYear, 2, 10), origin: 'Investimentos', accountId: '3' },
  // Abril
  { id: '8', description: 'Salário', type: 'Fixo', value: 12000, date: new Date(currentYear, 3, 5), origin: 'Empresa ABC', accountId: '1' },
  // Maio
  { id: '9', description: 'Salário', type: 'Fixo', value: 12000, date: new Date(currentYear, 4, 5), origin: 'Empresa ABC', accountId: '1' },
  { id: '10', description: 'Freelance', type: 'Variável', value: 3200, date: new Date(currentYear, 4, 22), origin: 'Cliente Z', accountId: '1' },
  // Junho
  { id: '11', description: 'Salário', type: 'Fixo', value: 12000, date: new Date(currentYear, 5, 5), origin: 'Empresa ABC', accountId: '1' },
  // Dezembro
  { id: '12', description: 'Salário', type: 'Fixo', value: 12000, date: new Date(currentYear, 11, 5), origin: 'Empresa ABC', accountId: '1' },
  { id: '13', description: 'Freelance', type: 'Variável', value: 4500, date: new Date(currentYear, 11, 10), origin: 'Cliente W', accountId: '1' },
  { id: '14', description: 'Bônus Anual', type: 'Sazonal', value: 8000, date: new Date(currentYear, 11, 20), origin: 'Empresa ABC', accountId: '2' },
];

export const mockExpenses: Expense[] = [
  // Janeiro
  { id: '1', description: 'Aluguel', type: 'Fixo', value: 3500, date: new Date(currentYear, 0, 1), accountId: '1', areaId: '1', categoryId: '1' },
  { id: '2', description: 'Condomínio', type: 'Fixo', value: 800, date: new Date(currentYear, 0, 5), accountId: '1', areaId: '1', categoryId: '2' },
  { id: '3', description: 'Energia Elétrica', type: 'Variável', value: 450, date: new Date(currentYear, 0, 10), accountId: '1', cardId: '2', areaId: '1', categoryId: '3' },
  { id: '4', description: 'Supermercado', type: 'Variável', value: 1200, date: new Date(currentYear, 0, 8), accountId: '1', cardId: '1', areaId: '2', categoryId: '5' },
  { id: '5', description: 'Restaurante', type: 'Variável', value: 350, date: new Date(currentYear, 0, 15), accountId: '1', cardId: '1', areaId: '2', categoryId: '6' },
  { id: '6', description: 'Combustível', type: 'Variável', value: 400, date: new Date(currentYear, 0, 12), accountId: '1', cardId: '2', areaId: '3', categoryId: '8' },
  { id: '7', description: 'Plano de Saúde', type: 'Fixo', value: 850, date: new Date(currentYear, 0, 5), accountId: '1', areaId: '4', categoryId: '11' },
  { id: '8', description: 'Netflix', type: 'Fixo', value: 55, date: new Date(currentYear, 0, 1), accountId: '1', cardId: '1', areaId: '5', categoryId: '14' },
  // Fevereiro
  { id: '9', description: 'Aluguel', type: 'Fixo', value: 3500, date: new Date(currentYear, 1, 1), accountId: '1', areaId: '1', categoryId: '1' },
  { id: '10', description: 'Condomínio', type: 'Fixo', value: 800, date: new Date(currentYear, 1, 5), accountId: '1', areaId: '1', categoryId: '2' },
  { id: '11', description: 'Energia Elétrica', type: 'Variável', value: 520, date: new Date(currentYear, 1, 10), accountId: '1', cardId: '2', areaId: '1', categoryId: '3' },
  { id: '12', description: 'Supermercado', type: 'Variável', value: 1350, date: new Date(currentYear, 1, 8), accountId: '1', cardId: '1', areaId: '2', categoryId: '5' },
  { id: '13', description: 'Combustível', type: 'Variável', value: 380, date: new Date(currentYear, 1, 14), accountId: '1', cardId: '2', areaId: '3', categoryId: '8' },
  { id: '14', description: 'Plano de Saúde', type: 'Fixo', value: 850, date: new Date(currentYear, 1, 5), accountId: '1', areaId: '4', categoryId: '11' },
  { id: '15', description: 'IPVA', type: 'Sazonal', value: 2800, date: new Date(currentYear, 1, 20), accountId: '1', areaId: '3', categoryId: '9' },
  // Março
  { id: '16', description: 'Aluguel', type: 'Fixo', value: 3500, date: new Date(currentYear, 2, 1), accountId: '1', areaId: '1', categoryId: '1' },
  { id: '17', description: 'Condomínio', type: 'Fixo', value: 800, date: new Date(currentYear, 2, 5), accountId: '1', areaId: '1', categoryId: '2' },
  { id: '18', description: 'Supermercado', type: 'Variável', value: 1100, date: new Date(currentYear, 2, 10), accountId: '1', cardId: '1', areaId: '2', categoryId: '5' },
  { id: '19', description: 'Curso Online', type: 'Variável', value: 450, date: new Date(currentYear, 2, 15), accountId: '1', cardId: '3', areaId: '6', categoryId: '15' },
  // Dezembro
  { id: '20', description: 'Aluguel', type: 'Fixo', value: 3500, date: new Date(currentYear, 11, 1), accountId: '1', areaId: '1', categoryId: '1' },
  { id: '21', description: 'Condomínio', type: 'Fixo', value: 850, date: new Date(currentYear, 11, 5), accountId: '1', areaId: '1', categoryId: '2' },
  { id: '22', description: 'Supermercado', type: 'Variável', value: 2200, date: new Date(currentYear, 11, 8), accountId: '1', cardId: '1', areaId: '2', categoryId: '5' },
  { id: '23', description: 'Presentes Natal', type: 'Sazonal', value: 1500, date: new Date(currentYear, 11, 18), accountId: '1', cardId: '1', areaId: '5', categoryId: '13' },
  { id: '24', description: 'Plano de Saúde', type: 'Fixo', value: 850, date: new Date(currentYear, 11, 5), accountId: '1', areaId: '4', categoryId: '11' },
];
