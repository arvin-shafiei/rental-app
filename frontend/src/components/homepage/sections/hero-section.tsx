import Image from "next/image"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-500">
            <span className="mr-1">🏠</span> UK Renters <span className="mx-1">·</span> Take control of your rental experience <span className="ml-1">→</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-blue-700">
              Take Control of Your
              <br />
              Rental Experience
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Photos, evidence, communications, and legal support—all in one helpful rental companion.
            </p>
          </div>
          <div className="space-y-4">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-8">Start Free</Button>
            <p className="text-xs text-gray-500">No credit card required. No obligations. Just support.</p>
          </div>
          <div className="relative w-full max-w-3xl mt-8">
            <div className="overflow-hidden rounded-lg border bg-white shadow-lg">
              <Image
                src="/placeholder.svg?height=400&width=800"
                alt="Rental app dashboard interface"
                width={800}
                height={400}
                className="w-full"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-blue-500 p-3 text-white shadow-lg">
                <Play className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
