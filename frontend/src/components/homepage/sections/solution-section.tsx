import Image from "next/image"
import { SectionHeading } from "@/components/ui/section-heading"

export default function SolutionSection() {
  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="HOW WE HELP"
            title="Your Rental Assistant"
            description="Our app provides practical tools to help you navigate your rental journey with confidence and peace of mind."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center space-y-4">
            <ul className="grid gap-6">
              <li className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-blue-600"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-medium text-blue-700">Deposit Protection Tracking</h3>
                  <p className="text-gray-500">
                    Keep track of your deposit protection and get reminders for key deadlines to ensure your money is safe.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-blue-600"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-medium text-blue-700">Repair Request Assistant</h3>
                  <p className="text-gray-500">
                    Create professional repair requests with photos and relevant legal references to get faster responses.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-blue-600"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-medium text-blue-700">Document Storage</h3>
                  <p className="text-gray-500">
                    Securely store all your rental documents, photos, and correspondence in one place for easy access.
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last">
            <Image
              alt="Rental Assistant Dashboard"
              src="/placeholder.svg?height=400&width=600"
              width="600"
              height="400"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
