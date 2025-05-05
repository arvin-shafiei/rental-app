import React from 'react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div className={cn('rounded-lg border text-card-foreground bg-background border-none shadow-lg', className)}>
      <div className="p-6 space-y-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h4 className="text-xl font-semibold">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
} 