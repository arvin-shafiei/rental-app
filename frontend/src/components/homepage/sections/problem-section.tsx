import { SectionHeading } from "@/components/ui/section-heading"
import { ShieldCheck } from "lucide-react"

export default function ProblemSection() {
  const problems = [
    {
      id: 1,
      title: "Deposit disputes",
      description: "Difficulty recovering your full deposit when moving out despite leaving the property in good condition."
    },
    {
      id: 2,
      title: "Maintenance delays",
      description: "Slow responses to repair requests and uncertainty about landlord responsibilities."
    },
    {
      id: 3,
      title: "Documentation challenges",
      description: "Lost receipts, missing evidence, and difficulty keeping track of important rental documents."
    },
    {
      id: 4,
      title: "Legal complexity",
      description: "Understanding your rights under different regional laws in England and Scotland."
    }
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="COMMON CHALLENGES"
            title="Renting Simplified"
            description="We understand the hurdles UK renters face day-to-day. Our app helps you navigate these challenges with confidence."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem) => (
            <div key={problem.id} className="flex flex-col items-start space-y-3 rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-blue-700">{problem.title}</h3>
              </div>
              <p className="text-gray-500">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
