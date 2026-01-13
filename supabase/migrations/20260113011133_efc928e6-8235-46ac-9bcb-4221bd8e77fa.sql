-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  budgeted_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One budget per category per month
  UNIQUE(user_id, category_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own budgets" 
ON public.budgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" 
ON public.budgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
ON public.budgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
ON public.budgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_budgets_user_month_year ON public.budgets(user_id, month, year);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for month/year values
CREATE OR REPLACE FUNCTION public.validate_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.month < 1 OR NEW.month > 12 THEN
    RAISE EXCEPTION 'Month must be between 1 and 12';
  END IF;
  IF NEW.year < 2000 OR NEW.year > 2100 THEN
    RAISE EXCEPTION 'Year must be between 2000 and 2100';
  END IF;
  IF NEW.budgeted_amount < 0 THEN
    RAISE EXCEPTION 'Budgeted amount cannot be negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_budget_trigger
BEFORE INSERT OR UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.validate_budget();