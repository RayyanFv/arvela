-- Repair script to sync company_id from employees table to profiles table
-- This ensures that hired employees are correctly associated with their company in their main profile record.

UPDATE public.profiles p
SET 
  company_id = e.company_id,
  role = 'employee'
FROM public.employees e
WHERE p.id = e.profile_id
AND (p.company_id IS NULL OR p.role != 'employee');
