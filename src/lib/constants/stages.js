// Warna dan label per stage — satu sumber kebenaran
export const STAGE_CONFIG = {
  applied: {
    label: 'Applied',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  screening: {
    label: 'Screening',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-500',
  },
  assessment: {
    label: 'Assessment',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  interview: {
    label: 'Interview',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500',
  },
  offering: {
    label: 'Offering',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  hired: {
    label: 'Hired',
    className: 'bg-green-50 text-green-700 border-green-200',
    dotColor: 'bg-green-600',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
  },
}

export const STAGE_ORDER = ['applied', 'screening', 'assessment', 'interview', 'offering', 'hired', 'rejected']
