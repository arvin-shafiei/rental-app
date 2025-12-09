import { SectionHeading } from "@/components/ui/section-heading"

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Sign Up for RentHive",
      description: "Create your account and enjoy a 30-day free trial with no credit card required."
    },
    {
      number: "02",
      title: "Document Your Property",
      description: "Use RentHive to take photos and store details about your rental property condition."
    },
    {
      number: "03",
      title: "Track Maintenance Issues",
      description: "Create, send, and follow up on maintenance requests through the RentHive platform."
    },
    {
      number: "04",
      title: "Manage Your Payments",
      description: "Record and track all your rental payments with RentHive's payment management system."
    }
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="GETTING STARTED"
            title="How RentHive Works"
            description="Get started in minutes and take control of your rental experience with these four simple steps."
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
              <p className="text-gray-700">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
