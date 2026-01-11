-- Fix sanitize_text function search_path
CREATE OR REPLACE FUNCTION public.sanitize_text(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
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