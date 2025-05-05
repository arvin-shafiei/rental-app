import React from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  subtitle?: string
  title: string
  description?: string
  className?: string
  subtitleClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function SectionHeading({
  subtitle,
  title,
  description,
  className,
  subtitleClassName,
  titleClassName,
  descriptionClassName
}: SectionHeadingProps) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {subtitle && (
        <p className={`text-sm font-medium uppercase tracking-wider ${subtitleClassName || 'text-gray-500'}`}>{subtitle}</p>
      )}
      <h2 className={`text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl ${titleClassName || ''}`}>
        {title}
      </h2>
      {description && (
        <p className={`mx-auto max-w-[700px] text-gray-500 md:text-xl ${descriptionClassName || ''}`}>
          {description}
        </p>
      )}
    </div>
  )
} 