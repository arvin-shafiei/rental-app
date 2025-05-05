import { SectionHeading } from "@/components/ui/section-heading"
import { CheckCircle2 } from "lucide-react"

export default function ProblemSection() {
  const problems = [
    {
      id: 1,
      title: "Time-consuming and repetitive tasks",
      description: "Manual processes slow down your team and lead to errors."
    },
    {
      id: 2,
      title: "Complex workflows",
      description: "Difficult to manage and optimize complex business processes."
    },
    {
      id: 3,
      title: "Limited data utilization",
      description: "Unable to efficiently analyze and act on available data."
    },
    {
      id: 4,
      title: "Resource constraints",
      description: "Not enough resources to handle growing business demands."
    }
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="THE CHALLENGE"
            title="Problems we solve"
            description="Many businesses face obstacles that prevent them from reaching their full potential."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem) => (
            <div key={problem.id} className="flex flex-col items-start space-y-3 rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
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
