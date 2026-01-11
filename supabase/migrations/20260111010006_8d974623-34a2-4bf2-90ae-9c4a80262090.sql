-- Fix search_path for all validation functions

CREATE OR REPLACE FUNCTION public.validate_monetary_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Check for positive values in incomes
  IF TG_TABLE_NAME = 'incomes' AND NEW.value <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;
  
  -- Check for positive values in expenses
  IF TG_TABLE_NAME = 'expenses' AND NEW.value <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;
  
  -- Check maximum value
  IF NEW.value > 999999999.99 THEN
    RAISE EXCEPTION 'Valor máximo excedido (999.999.999,99)';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_card_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Credit cards must have a limit > 0
  IF NEW.type = 'Crédito' AND (NEW.credit_limit IS NULL OR NEW.credit_limit <= 0) THEN
    RAISE EXCEPTION 'Cartão de crédito deve ter limite maior que zero';
  END IF;
  
  -- Validate day ranges
  IF NEW.due_day IS NOT NULL AND (NEW.due_day < 1 OR NEW.due_day > 31) THEN
    RAISE EXCEPTION 'Dia de vencimento deve estar entre 1 e 31';
  END IF;
  
  IF NEW.closing_day IS NOT NULL AND (NEW.closing_day < 1 OR NEW.closing_day > 31) THEN
    RAISE EXCEPTION 'Dia de fechamento deve estar entre 1 e 31';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_descriptions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Sanitize description field if it exists
  IF TG_TABLE_NAME IN ('incomes', 'expenses') THEN
    NEW.description := public.sanitize_text(NEW.description);
    
    -- Validate length
    IF LENGTH(NEW.description) > 200 THEN
      RAISE EXCEPTION 'Descrição deve ter no máximo 200 caracteres';
    END IF;
  END IF;
  
  -- Sanitize origin for incomes
  IF TG_TABLE_NAME = 'incomes' AND NEW.origin IS NOT NULL THEN
    NEW.origin := public.sanitize_text(NEW.origin);
    
    IF LENGTH(NEW.origin) > 200 THEN
      RAISE EXCEPTION 'Origem deve ter no máximo 200 caracteres';
    END IF;
  END IF;
  
  -- Sanitize name for accounts, cards, areas, categories
  IF TG_TABLE_NAME IN ('accounts', 'cards', 'areas', 'categories') THEN
    NEW.name := public.sanitize_text(NEW.name);
    
    IF LENGTH(NEW.name) > 100 THEN
      RAISE EXCEPTION 'Nome deve ter no máximo 100 caracteres';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_date_range()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  date_year INTEGER;
BEGIN
  -- Validate main date
  IF NEW.date IS NOT NULL THEN
    date_year := EXTRACT(YEAR FROM NEW.date::DATE);
    IF date_year < 2000 OR date_year > 2100 THEN
      RAISE EXCEPTION 'Data deve estar entre 2000 e 2100';
    END IF;
  END IF;
  
  -- Validate payment date
  IF TG_TABLE_NAME = 'expenses' AND NEW.payment_date IS NOT NULL THEN
    date_year := EXTRACT(YEAR FROM NEW.payment_date::DATE);
    IF date_year < 2000 OR date_year > 2100 THEN
      RAISE EXCEPTION 'Data de pagamento deve estar entre 2000 e 2100';
    END IF;
  END IF;
  
  -- Validate recurrence dates
  IF TG_TABLE_NAME = 'expenses' THEN
    IF NEW.recurrence_start_date IS NOT NULL THEN
      date_year := EXTRACT(YEAR FROM NEW.recurrence_start_date::DATE);
      IF date_year < 2000 OR date_year > 2100 THEN
        RAISE EXCEPTION 'Data de início da recorrência deve estar entre 2000 e 2100';
      END IF;
    END IF;
    
    IF NEW.recurrence_end_date IS NOT NULL THEN
      date_year := EXTRACT(YEAR FROM NEW.recurrence_end_date::DATE);
      IF date_year < 2000 OR date_year > 2100 THEN
        RAISE EXCEPTION 'Data de fim da recorrência deve estar entre 2000 e 2100';
      END IF;
    END IF;
    
    -- End date must be after start date
    IF NEW.recurrence_start_date IS NOT NULL AND NEW.recurrence_end_date IS NOT NULL THEN
      IF NEW.recurrence_end_date <= NEW.recurrence_start_date THEN
        RAISE EXCEPTION 'Data de fim deve ser após data de início';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;