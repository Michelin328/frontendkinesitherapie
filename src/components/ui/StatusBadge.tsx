type BadgeVariant = 'confirmed' | 'pending' | 'active' | 'done' | 'warning' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  active: 'bg-teal-50 text-teal-700',
  done: 'bg-slate-100 text-slate-600',
  warning: 'bg-orange-50 text-orange-700',
  info: 'bg-blue-50 text-blue-700',
}

const dotColors: Record<BadgeVariant, string> = {
  confirmed: 'bg-emerald-500',
  pending: 'bg-amber-500',
  active: 'bg-teal-500',
  done: 'bg-slate-400',
  warning: 'bg-orange-500',
  info: 'bg-blue-500',
}

interface StatusBadgeProps {
  variant: BadgeVariant
  label: string
  showDot?: boolean
}

export default function StatusBadge({ variant, label, showDot = false }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-status-badge font-status-badge ${variantClasses[variant]}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {label}
    </span>
  )
}
