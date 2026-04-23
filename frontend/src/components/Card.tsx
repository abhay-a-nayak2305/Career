import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  glow?: boolean
  hover?: boolean
}

export function Card({ children, glow = true, hover = true, className = '', ...props }: CardProps) {
  return (
    <div 
      className={['rounded-2xl p-6 bg-[rgba(13,13,20,0.7)] backdrop-blur-xl', glow ? 'glow-border' : 'border border-white/5', hover ? 'card-hover' : '', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
