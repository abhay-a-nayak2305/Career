interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white/70',
    success: 'bg-emerald-500/15 text-emerald-400',
    warning: 'bg-yellow-500/15 text-yellow-400',
    error: 'bg-red-500/15 text-red-400',
    info: 'bg-cyan-400/15 text-cyan-400'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  return (
    <span className={['inline-flex items-center rounded-full font-medium', variants[variant], sizes[size]].join(' ')}>
      {children}
    </span>
  )
}
