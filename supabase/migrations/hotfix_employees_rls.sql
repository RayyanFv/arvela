-- Hotfix RLS for Employees
-- Allow Super Admins to view all employees for easier debugging and management
-- Update existing policies

DROP POLICY IF EXISTS "HR can view company employees" ON public.employees;
DROP POLICY IF EXISTS "HR can manage employees" ON public.employees;

CREATE POLICY "HR/Admin can view employees" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        (role = 'super_admin') OR 
        (role IN ('hr', 'boss') AND company_id = employees.company_id)
      )
    )
  );

CREATE POLICY "HR/Admin can manage employees" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        (role = 'super_admin') OR 
        (role = 'hr' AND company_id = employees.company_id)
      )
    )
  );
