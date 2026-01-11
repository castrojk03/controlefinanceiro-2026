-- ============================================
-- DATABASE VALIDATION TRIGGERS AND CONSTRAINTS
-- ============================================

-- Function to sanitize text inputs (removes dangerous characters)
CREATE OR REPLACE FUNCTION public.sanitize_text(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN TRIM(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(input, '<script[^>]*>.*?</script>', '', 'gi'),
          'javascript:', '', 'gi'
        ),
        'on\w+\s*=', '', 'gi'
      ),
      '<[^>]*>', '', 'g'
    )
  );
END;
$$;

-- Function to validate monetary values
CREATE OR REPLACE FUNCTION public.validate_monetary_value()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Function to validate card credit limit
CREATE OR REPLACE FUNCTION public.validate_card_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Function to sanitize and validate descriptions
CREATE OR REPLACE FUNCTION public.sanitize_descriptions()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Function to validate date ranges
CREATE OR REPLACE FUNCTION public.validate_date_range()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Create triggers for incomes
DROP TRIGGER IF EXISTS validate_income_value ON public.incomes;
CREATE TRIGGER validate_income_value
  BEFORE INSERT OR UPDATE ON public.incomes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_monetary_value();

DROP TRIGGER IF EXISTS sanitize_income_descriptions ON public.incomes;
CREATE TRIGGER sanitize_income_descriptions
  BEFORE INSERT OR UPDATE ON public.incomes
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

DROP TRIGGER IF EXISTS validate_income_dates ON public.incomes;
CREATE TRIGGER validate_income_dates
  BEFORE INSERT OR UPDATE ON public.incomes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_date_range();

-- Create triggers for expenses
DROP TRIGGER IF EXISTS validate_expense_value ON public.expenses;
CREATE TRIGGER validate_expense_value
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_monetary_value();

DROP TRIGGER IF EXISTS sanitize_expense_descriptions ON public.expenses;
CREATE TRIGGER sanitize_expense_descriptions
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

DROP TRIGGER IF EXISTS validate_expense_dates ON public.expenses;
CREATE TRIGGER validate_expense_dates
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_date_range();

-- Create triggers for cards
DROP TRIGGER IF EXISTS validate_card ON public.cards;
CREATE TRIGGER validate_card
  BEFORE INSERT OR UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_card_limit();

DROP TRIGGER IF EXISTS sanitize_card_name ON public.cards;
CREATE TRIGGER sanitize_card_name
  BEFORE INSERT OR UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

-- Create triggers for accounts
DROP TRIGGER IF EXISTS sanitize_account_name ON public.accounts;
CREATE TRIGGER sanitize_account_name
  BEFORE INSERT OR UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

-- Create triggers for areas
DROP TRIGGER IF EXISTS sanitize_area_name ON public.areas;
CREATE TRIGGER sanitize_area_name
  BEFORE INSERT OR UPDATE ON public.areas
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

-- Create triggers for categories
DROP TRIGGER IF EXISTS sanitize_category_name ON public.categories;
CREATE TRIGGER sanitize_category_name
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();