-- Migration Fase 9.1 — RLS Fix untuk Company Holidays, Leave Types, dan Leave Balances

-- 1. Company Holidays (Admin dapat membuat, update, delete)
CREATE POLICY "Admins can insert company holidays" ON public.company_holidays
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );

CREATE POLICY "Admins can update company holidays" ON public.company_holidays
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );

CREATE POLICY "Admins can delete company holidays" ON public.company_holidays
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );

-- 2. Leave Types (Admin dapat membuat, update, delete)
CREATE POLICY "Admins can insert leave types" ON public.leave_types
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );

CREATE POLICY "Admins can update leave types" ON public.leave_types
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );

CREATE POLICY "Admins can delete leave types" ON public.leave_types
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );

-- 3. Leave Balances (Admin dapat mengatur balance)
CREATE POLICY "Admins can insert leave balances" ON public.leave_balances
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );

CREATE POLICY "Admins can update leave balances" ON public.leave_balances
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );

CREATE POLICY "Admins can delete leave balances" ON public.leave_balances
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner')
        )
    );
