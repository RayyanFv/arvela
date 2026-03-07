# Arvela — UI Components Reference
# Komponen siap pakai. Copy, sesuaikan props, langsung pakai.

---

## LAYOUT COMPONENTS

### DashboardLayout
```jsx
// components/layout/DashboardLayout.jsx
export function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-[hsl(0,0%,97%)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

### Sidebar
```jsx
// components/layout/Sidebar.jsx
export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-[hsl(222,47%,11%)] border-r border-[hsl(217,33%,17%)] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[hsl(217,33%,17%)]">
        <span className="text-white font-bold text-xl tracking-tight">
          AI<span className="text-[hsl(25,95%,53%)]">Career</span>
        </span>
      </div>
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* NavItem per menu */}
      </nav>
    </aside>
  )
}
```

### NavItem
```jsx
// components/layout/NavItem.jsx
import { cn } from '@/lib/utils/cn'

export function NavItem({ icon: Icon, label, href, isActive }) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-[hsl(222,47%,17%)] text-white"
          : "text-[hsl(215,20%,65%)] hover:bg-[hsl(222,47%,17%)] hover:text-[hsl(214,32%,91%)]"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-[hsl(25,95%,53%)]")} />
      <span className="flex-1">{label}</span>
      {isActive && <div className="w-1 h-4 rounded-full bg-[hsl(25,95%,53%)]" />}
    </a>
  )
}
```

### PageHeader
```jsx
// components/layout/PageHeader.jsx
export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)]">{title}</h1>
        {description && (
          <p className="text-sm text-[hsl(215,20%,65%)] mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
```

---

## CARD COMPONENTS

### StatCard
```jsx
// components/common/StatCard.jsx
export function StatCard({ title, value, change, trend = 'up', icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-[hsl(214,32%,91%)] p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[hsl(215,20%,65%)]">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-[hsl(33,100%,96%)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[hsl(25,95%,53%)]" />
        </div>
      </div>
      <p className="text-2xl font-bold text-[hsl(222,47%,11%)]">{value}</p>
      {change && (
        <p className={cn(
          "text-xs font-medium mt-1",
          trend === 'up' ? "text-[hsl(142,71%,45%)]" : "text-[hsl(0,72%,51%)]"
        )}>
          {trend === 'up' ? '↑' : '↓'} {change}
        </p>
      )}
    </div>
  )
}
```

---

## BADGE COMPONENTS

### StageBadge
```jsx
// components/candidates/StageBadge.jsx
import { STAGE_CONFIG } from '@/lib/constants/stages'
import { cn } from '@/lib/utils/cn'

export function StageBadge({ stage }) {
  const cfg = STAGE_CONFIG[stage] ?? { label: stage, bg: 'bg-gray-100', text: 'text-gray-600' }
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      cfg.bg, cfg.text
    )}>
      {cfg.label}
    </span>
  )
}
```

### RoleBadge
```jsx
const ROLE_CONFIG = {
  super_admin:     { label: 'Super Admin',     className: 'bg-purple-100 text-purple-700' },
  hr:              { label: 'HR',              className: 'bg-blue-100 text-blue-700' },
  hiring_manager:  { label: 'Hiring Manager',  className: 'bg-indigo-100 text-indigo-700' },
  boss:            { label: 'Boss',            className: 'bg-amber-100 text-amber-700' },
  employee:        { label: 'Employee',        className: 'bg-slate-100 text-slate-700' },
}

export function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  )
}
```

### WorkPhaseBadge
```jsx
const PHASE_CONFIG = {
  probation: { label: 'Probation', className: 'bg-amber-100 text-amber-700' },
  active:    { label: 'Active',    className: 'bg-green-100 text-green-700' },
  pip:       { label: 'PIP',       className: 'bg-red-100 text-red-700' },
}
```

### PerformanceStatusBadge
```jsx
// score >= 70 = On Track, 40-69 = Needs Attention, < 40 = At Risk
export function PerformanceStatusBadge({ score }) {
  const cfg = score >= 70
    ? { label: 'On Track', className: 'bg-green-100 text-green-700' }
    : score >= 40
    ? { label: 'Needs Attention', className: 'bg-amber-100 text-amber-700' }
    : { label: 'At Risk', className: 'bg-red-100 text-red-700' }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  )
}
```

---

## EMPTY STATE

```jsx
// components/common/EmptyState.jsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(33,100%,96%)] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[hsl(27,96%,61%)]" />
      </div>
      <h3 className="text-base font-semibold text-[hsl(222,47%,11%)] mb-1">{title}</h3>
      <p className="text-sm text-[hsl(215,20%,65%)] mb-6 max-w-xs leading-relaxed">{description}</p>
      {action}
    </div>
  )
}

// Usage:
<EmptyState
  icon={Briefcase}
  title="Belum ada lowongan"
  description="Buat lowongan pertama untuk mulai menerima pelamar."
  action={<Button onClick={...}>Buat Lowongan</Button>}
/>
```

---

## LOADING SKELETON

```jsx
// components/common/TableSkeleton.jsx
import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card grid skeleton
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[hsl(214,32%,91%)] p-5 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}
```

---

## BUTTON VARIANTS

```jsx
// Primary — orange
<Button className="bg-[hsl(25,95%,53%)] hover:bg-[hsl(21,90%,48%)] text-white">
  Simpan
</Button>

// Secondary — ghost
<Button variant="outline" className="border-[hsl(214,32%,91%)] text-[hsl(215,25%,35%)]">
  Batal
</Button>

// Destructive
<Button variant="destructive">
  Hapus
</Button>

// Orange ghost — untuk aksi minor
<Button variant="ghost" className="text-[hsl(21,90%,48%)] hover:bg-[hsl(33,100%,96%)]">
  <Eye className="w-4 h-4 mr-2" /> Lihat
</Button>
```

---

## CONFIRM DIALOG (Destructive)

```jsx
// components/common/ConfirmDialog.jsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = 'Hapus', variant = 'destructive' }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## CANDIDATE CARD

```jsx
// components/candidates/CandidateCard.jsx
import { StageBadge } from './StageBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Mail, Phone, Clock, FileText } from 'lucide-react'

export function CandidateCard({ application, onClick }) {
  const initials = application.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[hsl(214,32%,91%)] p-4 hover:shadow-md hover:border-[hsl(34,100%,92%)] transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarFallback className="bg-[hsl(34,100%,92%)] text-[hsl(17,88%,40%)] text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[hsl(222,47%,11%)] truncate">{application.full_name}</p>
          <StageBadge stage={application.stage} />
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-[hsl(215,20%,65%)]">
        <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /><span className="truncate">{application.email}</span></div>
        {application.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /><span>{application.phone}</span></div>}
        <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /><span>{new Date(application.created_at).toLocaleDateString('id-ID')}</span></div>
      </div>
      {application.cv_url && (
        <div className="mt-3 pt-3 border-t border-[hsl(214,32%,91%)]">
          <a
            href={application.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(21,90%,48%)] hover:text-[hsl(17,88%,40%)]"
          >
            <FileText className="w-3 h-3" /> Download CV
          </a>
        </div>
      )}
    </div>
  )
}
```

---

## PROGRESS RING (LMS)

```jsx
// components/lms/ProgressRing.jsx
export function ProgressRing({ percentage, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="hsl(33,100%,92%)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="hsl(25,95%,53%)" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold text-[hsl(222,47%,11%)]">{percentage}%</span>
    </div>
  )
}
```

---

## FORM PATTERN (react-hook-form + zod)

```jsx
// Contoh form buat job posting
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const jobSchema = z.object({
  title: z.string().min(3, 'Minimal 3 karakter'),
  employment_type: z.enum(['fulltime', 'parttime', 'contract', 'internship']),
  work_type: z.enum(['remote', 'hybrid', 'onsite']),
  location: z.string().optional(),
})

export function JobForm({ onSubmit }) {
  const form = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: { title: '', employment_type: 'fulltime', work_type: 'onsite' }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Judul Posisi <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="e.g. Frontend Engineer" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {/* ... fields lainnya */}
        <Button type="submit" disabled={form.formState.isSubmitting}
          className="bg-[hsl(25,95%,53%)] hover:bg-[hsl(21,90%,48%)] text-white w-full">
          {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Lowongan'}
        </Button>
      </form>
    </Form>
  )
}
```