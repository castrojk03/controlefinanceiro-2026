-- Fix sanitize_descriptions trigger to handle expenses table correctly
-- The issue is that expenses table doesn't have an 'origin' field

CREATE OR REPLACE FUNCTION public.sanitize_descriptions()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Sanitize description field for incomes and expenses
  IF TG_TABLE_NAME IN ('incomes', 'expenses') THEN
    NEW.description := public.sanitize_text(NEW.description);
    
    -- Validate length
    IF LENGTH(NEW.description) > 200 THEN
      RAISE EXCEPTION 'Descrição deve ter no máximo 200 caracteres';
    END IF;
  END IF;
  
  -- Sanitize origin ONLY for incomes (expenses doesn't have origin field)
  IF TG_TABLE_NAME = 'incomes' THEN
    IF NEW.origin IS NOT NULL THEN
      NEW.origin := public.sanitize_text(NEW.origin);
      
      IF LENGTH(NEW.origin) > 200 THEN
        RAISE EXCEPTION 'Origem deve ter no máximo 200 caracteres';
      END IF;
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
$function$;