import { SectionHeading } from "@/components/ui/section-heading"

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Connect your data",
      description: "Easily connect your data sources to our platform."
    },
    {
      number: "02",
      title: "Configure automation",
      description: "Set up your automation workflows with our intuitive tools."
    },
    {
      number: "03",
      title: "Get insights",
      description: "Receive intelligent insights and recommendations."
    },
    {
      number: "04",
      title: "Optimize & scale",
      description: "Continuously improve and scale your processes."
    }
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="HOW IT WORKS"
            title="Simple integration process"
            description="Our platform is designed to be easy to set up and use. Follow these simple steps to get started."
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
