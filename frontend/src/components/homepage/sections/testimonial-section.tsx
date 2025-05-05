import Image from "next/image"
import { SectionHeading } from "@/components/ui/section-heading"

export default function TestimonialSection() {
  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="TESTIMONIAL"
            title="What our customers say"
            description="Read what industry leaders have to say about our product."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <div className="mx-auto max-w-3xl rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full">
              <Image
                src="/placeholder.svg?height=80&width=80"
                width={80}
                height={80}
                alt="Testimonial author"
                className="object-cover"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-blue-700">Sarah Johnson</h3>
              <p className="text-sm text-gray-500">CEO, Innovative Solutions</p>
            </div>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 text-blue-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
              ))}
            </div>
            <blockquote className="mt-4 text-gray-600">
              <p className="text-lg">
                "This AI platform has completely transformed our business operations. The automated
                workflows have saved us countless hours and the insights provided have led to a 30%
                increase in our overall efficiency. I couldn't recommend it more highly."
              </p>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}
