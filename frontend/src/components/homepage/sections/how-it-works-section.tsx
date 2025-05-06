import { SectionHeading } from "@/components/ui/section-heading"

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Document Your Move-In",
      description: "Take photos and notes of your property's condition when you move in."
    },
    {
      number: "02",
      title: "Store Important Documents",
      description: "Upload your lease, correspondence, and receipts to keep everything in one place."
    },
    {
      number: "03",
      title: "Manage Maintenance Issues",
      description: "Create and send professional repair requests with photo evidence."
    },
    {
      number: "04",
      title: "Protect Your Deposit",
      description: "Monitor protection schemes and prepare evidence for a smooth move-out."
    }
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="YOUR RENTAL JOURNEY"
            title="How to use our app"
            description="Our app supports you through your entire rental experience with these simple steps."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center space-y-4 rounded-lg border border-blue-100 bg-white p-6 text-center shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                {step.number}
              </div>
              <h3 className="text-xl font-medium text-blue-700">{step.title}</h3>
              <p className="text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
