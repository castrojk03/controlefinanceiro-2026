import { z } from 'zod';

// ==========================================
// SANITIZATION UTILITIES
// ==========================================

/**
 * Removes potentially dangerous content from text inputs
 * Protects against XSS, script injection, and SQL injection
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Trim whitespace
    .trim()
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers (onclick, onerror, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Remove other dangerous HTML attributes
    .replace(/(src|href)\s*=\s*["']?javascript:/gi, '')
    // Remove HTML tags but keep content
    .replace(/<[^>]*>/g, '')
    // Escape special characters for safety
    .replace(/[<>"'&]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;',
      };
      return escapeMap[char] || char;
    })
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Parses Brazilian currency format to number
 * Handles: 1.234,56 -> 1234.56
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove R$ prefix and spaces
  const cleaned = value
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    // Remove thousand separators (dots)
    .replace(/\./g, '')
    // Replace decimal separator (comma) with dot
    .replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats number to Brazilian currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Validates date is within reasonable range (2000-2100)
 */
export function isValidDateRange(date: Date): boolean {
  const year = date.getFullYear();
  return year >= 2000 && year <= 2100;
}

/**
 * Validates day of month (1-31)
 */
export function isValidDayOfMonth(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

// ==========================================
// ZOD SCHEMAS
// ==========================================

// Custom refinements
const positiveNumber = z.number()
  .positive('Valor deve ser positivo')
  .max(999999999.99, 'Valor máximo excedido');

const sanitizedString = (maxLength: number, minLength = 1) => 
  z.string()
    .min(minLength, `Mínimo de ${minLength} caractere(s)`)
    .max(maxLength, `Máximo de ${maxLength} caracteres`)
    .transform(sanitizeText);

const validDate = z.date()
  .refine(isValidDateRange, 'Data deve estar entre 2000 e 2100');

const dayOfMonth = z.number()
  .int('Dia deve ser um número inteiro')
  .min(1, 'Dia mínimo é 1')
  .max(31, 'Dia máximo é 31');

// Transaction types
export const transactionTypeSchema = z.enum(['Fixo', 'Variável', 'Sazonal']);
export const expenseStatusSchema = z.enum(['paid', 'scheduled']);
export const paymentMethodSchema = z.enum(['Débito', 'Crédito']);
export const recurrenceTypeSchema = z.enum(['none', 'date_range', 'installments', 'frequency']);
export const recurrenceFrequencySchema = z.enum(['weekly', 'monthly', 'yearly']);

// Income Schema
export const incomeSchema = z.object({
  description: sanitizedString(200),
  type: transactionTypeSchema,
  value: positiveNumber,
  date: validDate,
  origin: sanitizedString(200),
  accountId: z.string().uuid('ID de conta inválido'),
});

// Expense Schema
export const expenseSchema = z.object({
  description: sanitizedString(200),
  type: transactionTypeSchema,
  value: positiveNumber,
  date: validDate,
  accountId: z.string().uuid('ID de conta inválido'),
  cardId: z.string().uuid('ID de cartão inválido').optional(),
  areaId: z.string().uuid('ID de área inválido'),
  categoryId: z.string().uuid('ID de categoria inválido'),
  status: expenseStatusSchema,
  paymentDate: validDate.optional(),
  recurrence: z.object({
    type: recurrenceTypeSchema,
    startDate: validDate.optional(),
    endDate: validDate.optional(),
    installments: z.number().int().min(1).max(360).optional(),
    frequency: recurrenceFrequencySchema.optional(),
  }).optional(),
});

// Account Schema
export const accountSchema = z.object({
  name: sanitizedString(100),
  balance: z.number().min(-999999999.99).max(999999999.99),
  color: z.string().regex(/^hsl\(\d{1,3},\s*\d{1,3}%,\s*\d{1,3}%\)$/, 'Cor inválida'),
});

// Card Schema
export const cardSchema = z.object({
  name: sanitizedString(100),
  type: paymentMethodSchema,
  lastDigits: z.string()
    .length(4, 'Deve ter exatamente 4 dígitos')
    .regex(/^\d{4}$/, 'Apenas números'),
  color: z.string().regex(/^hsl\(\d{1,3},\s*\d{1,3}%,\s*\d{1,3}%\)$/, 'Cor inválida'),
  accountId: z.string().uuid('ID de conta inválido'),
  creditLimit: z.number()
    .min(0, 'Limite não pode ser negativo')
    .max(9999999.99, 'Limite máximo excedido'),
  dueDay: dayOfMonth,
  closingDay: dayOfMonth,
}).refine((data) => {
  // Credit cards MUST have a limit > 0
  if (data.type === 'Crédito' && data.creditLimit <= 0) {
    return false;
  }
  return true;
}, {
  message: 'Cartão de crédito deve ter limite maior que zero',
  path: ['creditLimit'],
});

// Area Schema
export const areaSchema = z.object({
  name: sanitizedString(100),
  color: z.string().regex(/^hsl\(\d{1,3},\s*\d{1,3}%,\s*\d{1,3}%\)$/, 'Cor inválida'),
});

// Category Schema
export const categorySchema = z.object({
  name: sanitizedString(100),
  areaId: z.string().uuid('ID de área inválido'),
});

// ==========================================
// VALIDATION HELPERS
// ==========================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validateIncome(data: unknown): ValidationResult<z.infer<typeof incomeSchema>> {
  const result = incomeSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
  };
}

export function validateExpense(data: unknown): ValidationResult<z.infer<typeof expenseSchema>> {
  const result = expenseSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
  };
}

export function validateAccount(data: unknown): ValidationResult<z.infer<typeof accountSchema>> {
  const result = accountSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
  };
}

export function validateCard(data: unknown): ValidationResult<z.infer<typeof cardSchema>> {
  const result = cardSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
  };
}

export function validateArea(data: unknown): ValidationResult<z.infer<typeof areaSchema>> {
  const result = areaSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
  };
}

export function validateCategory(data: unknown): ValidationResult<z.infer<typeof categorySchema>> {
  const result = categorySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
  };
}

// ==========================================
// FORM VALUE PARSERS
// ==========================================

/**
 * Safely parses a value input to a validated positive number
 */
export function parseMonetaryValue(input: string): number | null {
  const value = parseCurrency(input);
  if (value <= 0) return null;
  if (value > 999999999.99) return null;
  // Round to 2 decimal places
  return Math.round(value * 100) / 100;
}

/**
 * Safely parses a date string to a validated Date object
 */
export function parseValidDate(input: string): Date | null {
  const date = new Date(input);
  if (isNaN(date.getTime())) return null;
  if (!isValidDateRange(date)) return null;
  return date;
}

/**
 * Validates installments count
 */
export function parseInstallments(input: string): number | null {
  const value = parseInt(input);
  if (isNaN(value)) return null;
  if (value < 1 || value > 360) return null;
  return value;
}
