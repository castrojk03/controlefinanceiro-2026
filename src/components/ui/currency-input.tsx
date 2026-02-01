import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string, numericValue: number) => void;
  error?: boolean;
}

/**
 * Currency input component with Brazilian Real (BRL) formatting
 * - Formats as R$ 1.234,56
 * - Only accepts positive values
 * - Maximum 2 decimal places
 * - Maximum value: 999.999.999,99
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, error, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value);
    const [isFocused, setIsFocused] = React.useState(false);

    // Parse Brazilian currency format to number
    const parseToNumber = (val: string): number => {
      if (!val) return 0;
      const cleaned = val
        .replace(/R\$\s*/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Format number to Brazilian currency
    const formatToCurrency = (num: number): string => {
      if (num === 0) return '';
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove all non-numeric characters except comma and dot
      inputValue = inputValue.replace(/[^\d,\.]/g, '');
      
      // Convert dot to comma for Brazilian format (accept both separators)
      inputValue = inputValue.replace(/\./g, ',');
      
      // Ensure only one comma
      const commaCount = (inputValue.match(/,/g) || []).length;
      if (commaCount > 1) {
        const parts = inputValue.split(',');
        inputValue = parts[0] + ',' + parts.slice(1).join('');
      }
      
      // Limit decimal places to 2
      const parts = inputValue.split(',');
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2);
        inputValue = parts.join(',');
      }
      
      // Parse and validate - use parseToNumber which handles Brazilian format
      const numericValue = parseToNumber(inputValue);
      
      // Reject negative values
      if (numericValue < 0) return;
      
      // Reject values over maximum
      if (numericValue > 999999999.99) return;
      
      setDisplayValue(inputValue);
      onValueChange(inputValue, numericValue);
    };

    // Format on blur
    const handleBlur = () => {
      setIsFocused(false);
      const numericValue = parseToNumber(displayValue);
      if (numericValue > 0) {
        const formatted = formatToCurrency(numericValue);
        setDisplayValue(formatted);
        onValueChange(formatted, numericValue);
      } else {
        setDisplayValue('');
        onValueChange('', 0);
      }
    };

    // Clear formatting on focus for easier editing
    const handleFocus = () => {
      setIsFocused(true);
    };

    // Sync with external value changes
    React.useEffect(() => {
      if (!isFocused) {
        const numericValue = parseToNumber(value);
        if (numericValue > 0) {
          setDisplayValue(formatToCurrency(numericValue));
        } else {
          setDisplayValue(value);
        }
      }
    }, [value, isFocused]);

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn(
            'pl-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
