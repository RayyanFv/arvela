import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayoutWrapper'

export default function DashboardLayout({ children }) {
    return (
        <DashboardLayoutWrapper>
            {children}
        </DashboardLayoutWrapper>
    )
}
