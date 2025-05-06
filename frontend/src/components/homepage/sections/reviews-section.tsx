import { SectionHeading } from "@/components/ui/section-heading"
import { VerticalScrollingTestimonials } from "@/components/ui/vertical-scrolling-testimonials"

export default function ReviewsSection() {
  const testimonials = [
    {
      id: 1,
      content: "The deposit protection tracker alerted me that my landlord hadn't registered my deposit within the legal timeframe. Thanks to the app, I was able to politely remind them and get it properly protected.",
      author: {
        name: "James Mitchell",
        role: "Tenant in London",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Got my deposit properly protected."
    },
    {
      id: 2,
      content: "The document storage feature has been incredibly helpful. I can access my lease agreement, inventory, and rent receipts instantly when I need them. No more digging through emails or paper files.",
      author: {
        name: "Sarah Chen",
        role: "Tenant in Edinburgh",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 3,
      content: "Being able to take detailed photos when I moved in and store them securely gave me peace of mind. When I moved out, I was able to prove the condition of everything and got my full deposit back.",
      author: {
        name: "Omar Patel",
        role: "Tenant in Birmingham",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Got my full deposit back."
    },
    {
      id: 4,
      content: "The repair request templates are professional and effective. My landlord responded much faster than usual, and the issue was resolved without any confrontation.",
      author: {
        name: "Lucy Wilson",
        role: "Tenant in Glasgow",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Issue resolved without any confrontation."
    },
    {
      id: 5,
      content: "As a student renting for the first time, the plain English explanations of my lease terms were invaluable. I finally understood what I was actually agreeing to.",
      author: {
        name: "David Brown",
        role: "Student Tenant in Leeds",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 6,
      content: "The regional settings feature is brilliant. When I moved from England to Scotland, the app automatically adjusted to show me the relevant laws and rights for my new location.",
      author: {
        name: "Emma Taylor",
        role: "Tenant in Aberdeen",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 7,
      content: "Using the timeline feature to track important dates has been so helpful. I never miss inspections or renewal deadlines now, and I can prepare properly for each one.",
      author: {
        name: "Aisha Khan",
        role: "Tenant in Manchester",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "I never miss important rental dates now."
    },
    {
      id: 8,
      content: "The flatmate agreement builder helped us agree on house rules and responsibilities up front. It's made sharing a house much more pleasant and reduced disagreements significantly.",
      author: {
        name: "Tom Chen",
        role: "Tenant in Bristol",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Made sharing a house much more pleasant."
    },
    {
      id: 9,
      content: "When my boiler broke in winter, the app helped me document the issue and send an effective email with temperature readings. I had heat back within 24 hours. Absolutely worth it.",
      author: {
        name: "Carlos Gomez",
        role: "Tenant in Cardiff",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Had heat back within 24 hours."
    },
    {
      id: 10,
      content: "The rent comparison tool showed me that my landlord's proposed increase was well above the local average. I was able to negotiate a fairer price based on actual data.",
      author: {
        name: "Jake Morrison",
        role: "Tenant in Newcastle",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Negotiated a fairer rent increase."
    },
    {
      id: 11,
      content: "Moving every year as a student was always stressful until I started using this app. Having all my previous inventory reports and photos in one place makes comparing properties so much easier.",
      author: {
        name: "Nadia Ali",
        role: "Student Tenant in Sheffield",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Makes comparing rental properties easier."
    },
    {
      id: 12,
      content: "After finding mold in my bedroom, I used the app to create a detailed report with photos. My landlord arranged for professional treatment right away after seeing my well-documented case.",
      author: {
        name: "Sofia Patel",
        role: "Tenant in Liverpool",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Landlord arranged professional treatment right away."
    },
    {
      id: 13,
      content: "The contract analyzer spotted a hidden cleaning fee clause in my lease that I would have missed. I was able to discuss it with the landlord before signing and got it removed.",
      author: {
        name: "David Kim",
        role: "Tenant in Nottingham",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Spotted a hidden fee clause before signing."
    },
    {
      id: 14,
      content: "Managing repairs in my property used to be so frustrating. Now I can track all communication with my landlord in one place and have evidence of when issues were reported.",
      author: {
        name: "Jennifer Lopez",
        role: "Tenant in Southampton",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Evidence of when issues were reported."
    },
    {
      id: 15,
      content: "I used to be intimidated by my landlord, but having access to clear information about my rights has given me confidence. I now feel empowered to raise legitimate concerns.",
      author: {
        name: "Mark Williams",
        role: "Tenant in Belfast",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "I now feel empowered to raise legitimate concerns."
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="RENTER EXPERIENCES"
            title="Hear from people like you"
            description="Real stories from renters across the UK who have used our app to improve their rental experience."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <VerticalScrollingTestimonials testimonials={testimonials} />
      </div>
    </section>
  )
}
