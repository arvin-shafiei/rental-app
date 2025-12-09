import { SectionHeading } from "@/components/ui/section-heading"
import { ShieldCheck } from "lucide-react"

export default function ProblemSection() {
  const problems = [
    {
      id: 1,
      title: "Deposit disputes",
      description: "RentHive helps you document property condition with timestamped photos to recover your full deposit."
    },
    {
      id: 2,
      title: "Maintenance delays",
      description: "Track and manage repair requests through RentHive's simple system with automatic follow-ups."
    },
    {
      id: 3,
      title: "Documentation challenges",
      description: "RentHive securely stores all your rental documents in one place for easy access whenever needed."
    },
    {
      id: 4,
      title: "Payment tracking",
      description: "Keep track of all your rental payments in RentHive with automatic reminders and receipt storage."
    }
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
            <SectionHeading
            subtitle="COMMON CHALLENGES"
            title="Rental Problems We Solve"
            description="RentHive helps you overcome the most common rental challenges with practical tools and expert guidance."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem) => (
            <div key={problem.id} className="flex flex-col items-start space-y-3 rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-700">{problem.title}</h3>
              </div>
              <p className="text-gray-700">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
