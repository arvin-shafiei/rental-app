import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface StepItemProps {
  step: string
  title: string
  description: string
  imageSrc?: string
  className?: string
  imagePosition?: 'left' | 'right'
}

export function StepItem({ 
  step, 
  title, 
  description, 
  imageSrc, 
  className,
  imagePosition = 'right' 
}: StepItemProps) {
  return (
    <div className={cn('flex flex-col md:flex-row items-center gap-8 py-8', className)}>
      <div className={cn('flex-1 space-y-4', {
        'order-1': imagePosition === 'right',
        'order-2': imagePosition === 'left'
      })}>
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 h-10 w-10">
          <span className="text-primary font-medium text-sm">{step}</span>
        </div>
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      {imageSrc && (
        <div className={cn('flex-1', {
          'order-2': imagePosition === 'right',
          'order-1': imagePosition === 'left'
        })}>
          <div className="relative aspect-video overflow-hidden rounded-lg shadow-lg">
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
    </div>
  )
} 