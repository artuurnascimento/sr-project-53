-- Create time_entries table
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  punch_type TEXT NOT NULL CHECK (punch_type IN ('IN', 'OUT', 'BREAK_IN', 'BREAK_OUT')),
  punch_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_address TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_entries
CREATE POLICY "Employees can manage their own time entries" 
ON public.time_entries 
FOR ALL 
USING (employee_id = get_current_user_profile_id())
WITH CHECK (employee_id = get_current_user_profile_id());

CREATE POLICY "Managers can view all time entries" 
ON public.time_entries 
FOR SELECT 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Managers can update time entries" 
ON public.time_entries 
FOR UPDATE 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'manager'::text]));

-- Create trigger for updated_at
CREATE TRIGGER update_time_entries_updated_at
BEFORE UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();