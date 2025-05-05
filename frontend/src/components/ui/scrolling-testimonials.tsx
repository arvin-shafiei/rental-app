import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type TestimonialAuthor = {
  name: string;
  role?: string;
  avatar: string;
};

type Testimonial = {
  id: number;
  content: string;
  author: TestimonialAuthor;
  highlight?: string;
  rating?: number;
  name?: string;
  title?: string;
  company?: string;
};

interface ScrollingTestimonialsProps {
  testimonials: Testimonial[]
  className?: string
}

export function ScrollingTestimonials({ testimonials = [], className }: ScrollingTestimonialsProps) {
  // Use empty array if testimonials is undefined
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="flex animate-marquee space-x-8 pb-8">
        {safeTestimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="relative flex w-80 flex-shrink-0 flex-col justify-between rounded-xl border border-blue-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4">
              <div className="h-12 text-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">{testimonial.content}</p>
              {testimonial.highlight && (
                <p className="mt-2 font-medium text-blue-700">"{testimonial.highlight}"</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100">
                <img
                  src={testimonial.author.avatar}
                  alt={testimonial.author.name}
                  className="h-full w-full rounded-full"
                />
              </div>
              <div>
                <p className="font-medium text-blue-700">
                  {testimonial.author.name || testimonial.name}
                </p>
                <p className="text-xs text-gray-500">
                  {testimonial.author.role || `${testimonial.title}, ${testimonial.company}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background"></div>
    </div>
  )
} 