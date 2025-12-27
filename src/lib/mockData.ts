import { Account, Card, Area, Category, Income, Expense } from '@/types/finance';

export const mockAccounts: Account[] = [];

export const mockCards: Card[] = [];

export const initialAreas: Area[] = [
  { id: "area-1", name: "Habitação", color: "#3b82f6" },
  { id: "area-2", name: "Saúde", color: "#ef4444" },
  { id: "area-3", name: "Cartões", color: "#8b5cf6" },
  { id: "area-4", name: "Alimentação", color: "#f97316" },
  { id: "area-5", name: "Educação", color: "#22c55e" },
  { id: "area-6", name: "Transporte", color: "#eab308" },
  { id: "area-7", name: "Despesas Pessoais", color: "#ec4899" },
  { id: "area-8", name: "Contas CNPJ", color: "#64748b" },
  { id: "area-9", name: "Assinatura", color: "#06b6d4" },
  { id: "area-10", name: "Lazer", color: "#a855f7" },
];

export const initialCategories: Category[] = [
  // Habitação
  { id: "cat-1", name: "Aluguel (+ Taxas)", areaId: "area-1" },
  { id: "cat-2", name: "Condomínio", areaId: "area-1" },
  { id: "cat-3", name: "Conta de Água", areaId: "area-1" },
  { id: "cat-4", name: "Conta de Energia", areaId: "area-1" },
  { id: "cat-5", name: "Conta de gás", areaId: "area-1" },
  { id: "cat-6", name: "Internet", areaId: "area-1" },
  { id: "cat-7", name: "Materiais / Utensílios", areaId: "area-1" },
  { id: "cat-8", name: "Outros", areaId: "area-1" },
  
  // Saúde
  { id: "cat-9", name: "Plano de Saúde", areaId: "area-2" },
  { id: "cat-10", name: "Psicólogo", areaId: "area-2" },
  { id: "cat-11", name: "Dentista", areaId: "area-2" },
  { id: "cat-12", name: "Medicamentos", areaId: "area-2" },
  { id: "cat-13", name: "Academia", areaId: "area-2" },
  { id: "cat-14", name: "Luta", areaId: "area-2" },
  { id: "cat-15", name: "Outros", areaId: "area-2" },
  
  // Cartões
  { id: "cat-16", name: "Caixa", areaId: "area-3" },
  { id: "cat-17", name: "Santander", areaId: "area-3" },
  { id: "cat-18", name: "Nubank", areaId: "area-3" },
  
  // Alimentação
  { id: "cat-19", name: "Supermercado", areaId: "area-4" },
  { id: "cat-20", name: "Mercado", areaId: "area-4" },
  { id: "cat-21", name: "Açougue", areaId: "area-4" },
  { id: "cat-22", name: "Feira", areaId: "area-4" },
  { id: "cat-23", name: "Padaria", areaId: "area-4" },
  { id: "cat-24", name: "Adega", areaId: "area-4" },
  { id: "cat-25", name: "Outros", areaId: "area-4" },
  
  // Educação
  { id: "cat-26", name: "Graduação", areaId: "area-5" },
  { id: "cat-27", name: "Cursos Online", areaId: "area-5" },
  { id: "cat-28", name: "Plataformas", areaId: "area-5" },
  { id: "cat-29", name: "Treinamentos", areaId: "area-5" },
  { id: "cat-30", name: "Outros", areaId: "area-5" },
  
  // Transporte
  { id: "cat-31", name: "TOP - John", areaId: "area-6" },
  { id: "cat-32", name: "TOP - Amanda", areaId: "area-6" },
  { id: "cat-33", name: "Ônibus", areaId: "area-6" },
  { id: "cat-34", name: "Metrô", areaId: "area-6" },
  { id: "cat-35", name: "Trem", areaId: "area-6" },
  { id: "cat-36", name: "Uber", areaId: "area-6" },
  
  // Despesas Pessoais
  { id: "cat-37", name: "Higiene Pessoal (unha, depilação etc.)", areaId: "area-7" },
  { id: "cat-38", name: "Cosméticos", areaId: "area-7" },
  { id: "cat-39", name: "Barbeiro", areaId: "area-7" },
  { id: "cat-40", name: "Cabeleireiro", areaId: "area-7" },
  { id: "cat-41", name: "Vestuário", areaId: "area-7" },
  { id: "cat-42", name: "Calçados", areaId: "area-7" },
  { id: "cat-43", name: "Pet - Luke", areaId: "area-7" },
  { id: "cat-44", name: "Pet - Tosa e Banho", areaId: "area-7" },
  { id: "cat-45", name: "Esportes", areaId: "area-7" },
  { id: "cat-46", name: "Outros", areaId: "area-7" },
  
  // Contas CNPJ
  { id: "cat-47", name: "DAS - MEI", areaId: "area-8" },
  { id: "cat-48", name: "COFINS", areaId: "area-8" },
  { id: "cat-49", name: "ISS", areaId: "area-8" },
  { id: "cat-50", name: "PIS", areaId: "area-8" },
  { id: "cat-51", name: "Mensalidade Contador", areaId: "area-8" },
  { id: "cat-52", name: "Parcelamento DAS", areaId: "area-8" },
  { id: "cat-53", name: "mLabs", areaId: "area-8" },
  { id: "cat-54", name: "IR", areaId: "area-8" },
  { id: "cat-55", name: "CSLL", areaId: "area-8" },
  
  // Assinatura
  { id: "cat-56", name: "Netflix", areaId: "area-9" },
  { id: "cat-57", name: "Amazon Prime", areaId: "area-9" },
  { id: "cat-58", name: "TotalPass", areaId: "area-9" },
  
  // Lazer
  { id: "cat-59", name: "JOHN", areaId: "area-10" },
  { id: "cat-60", name: "AMANDA", areaId: "area-10" },
  { id: "cat-61", name: "CASAL", areaId: "area-10" },
  { id: "cat-62", name: "Presentes", areaId: "area-10" },
  { id: "cat-63", name: "Outros", areaId: "area-10" },
];

export const mockAreas: Area[] = [];

export const mockCategories: Category[] = [];

export const mockIncomes: Income[] = [];

export const mockExpenses: Expense[] = [];
