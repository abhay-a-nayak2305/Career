interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient'
}

export function ProgressBar({ value, max = 100, size = 'md', variant = 'gradient' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className={['w-full bg-white/10 rounded-full overflow-hidden', sizes[size]].join(' ')}>
      <div 
        className={['h-full rounded-full transition-all duration-1000 ease-out', variant === 'gradient' ? 'progress-fill' : 'bg-cyan-400'].join(' ')}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
