import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'font-semibold tracking-wide transition-all duration-300 relative overflow-hidden rounded-xl'
  
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-400/20 to-fuchsia-500/20 border border-cyan-400/30 hover:shadow-glow hover:-translate-y-0.5',
    secondary: 'bg-white/5 border border-white/10 hover:bg-white/10',
    ghost: 'hover:bg-white/5'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button 
      className={[baseStyles, variants[variant], sizes[size], className].join(' ')}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 -translate-x-full hover:translate-x-full transition-transform duration-700" />
    </button>
  )
}
