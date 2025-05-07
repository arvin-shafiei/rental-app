import { SectionHeading } from "@/components/ui/section-heading"
import { VerticalScrollingTestimonials } from "@/components/ui/vertical-scrolling-testimonials"

export default function ReviewsSection() {
  const testimonials = [
    {
      id: 1,
      content: "RentHive's payment tracker alerted me that my landlord hadn't registered my deposit within the legal timeframe. Thanks to the app, I was able to politely remind them and get it properly protected.",
      author: {
        name: "James Mitchell",
        role: "RentHive User in London",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "RentHive protected my deposit."
    },
    {
      id: 2,
      content: "The document storage feature in RentHive has been incredibly helpful. I can access my lease agreement, inventory, and rent receipts instantly when I need them. No more digging through emails.",
      author: {
        name: "Sarah Chen",
        role: "RentHive User in Edinburgh",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 3,
      content: "Being able to take detailed photos with RentHive when I moved in gave me peace of mind. When I moved out, I was able to prove the condition of everything and got my full deposit back.",
      author: {
        name: "Omar Patel",
        role: "RentHive User in Birmingham",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Got my full deposit back with RentHive."
    },
    {
      id: 4,
      content: "RentHive's maintenance request templates are professional and effective. My landlord responded much faster than usual, and the issue was resolved without any confrontation.",
      author: {
        name: "Lucy Wilson",
        role: "RentHive User in Glasgow",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Issue resolved quickly with RentHive."
    },
    {
      id: 5,
      content: "As a first-time renter, RentHive's plain English explanations of my lease terms were invaluable. I finally understood what I was actually agreeing to when signing my contract.",
      author: {
        name: "David Brown",
        role: "Student RentHive User in Leeds",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 6,
      content: "The payment tracking feature in RentHive is brilliant. Every payment is recorded with a receipt, and I have a complete history of all my rental transactions in one secure place.",
      author: {
        name: "Emma Taylor",
        role: "RentHive User in Aberdeen",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 7,
      content: "Using RentHive's timeline feature to track important dates has been so helpful. I never miss inspections or renewal deadlines now, and I can prepare properly for each one.",
      author: {
        name: "Aisha Khan",
        role: "RentHive User in Manchester",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Never miss important rental dates with RentHive."
    },
    {
      id: 8,
      content: "The roommate management feature in RentHive helped us agree on house rules and responsibilities up front. It's made sharing a house much more pleasant and reduced disagreements significantly.",
      author: {
        name: "Tom Chen",
        role: "RentHive User in Bristol",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "RentHive made sharing a house easier."
    },
    {
      id: 9,
      content: "When my boiler broke in winter, RentHive helped me document the issue and send an effective email with temperature readings. I had heat back within 24 hours. The yearly plan is absolutely worth it.",
      author: {
        name: "Carlos Gomez",
        role: "RentHive User in Cardiff",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Had heat back within 24 hours using RentHive."
    },
    {
      id: 10,
      content: "RentHive's document organizer showed me that my landlord's proposed increase was well above the local average. I was able to negotiate a fairer price based on actual data.",
      author: {
        name: "Jake Morrison",
        role: "RentHive User in Newcastle",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Negotiated a fairer rent with RentHive data."
    },
    {
      id: 11,
      content: "Moving every year as a student was always stressful until I started using RentHive. Having all my previous inventory reports and photos in one place makes comparing properties so much easier.",
      author: {
        name: "Nadia Ali",
        role: "Student RentHive User in Sheffield",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "RentHive makes comparing rental properties easier."
    },
    {
      id: 12,
      content: "After finding mold in my bedroom, I used RentHive to create a detailed report with photos. My landlord arranged for professional treatment right away after seeing my well-documented case.",
      author: {
        name: "Sofia Patel",
        role: "RentHive User in Liverpool",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "RentHive documentation got fast results."
    },
    {
      id: 13,
      content: "I became a RentHive Founding Member and it's the best decision I made for my rental experience. The lifetime access means I'll never have to worry about rental documentation again.",
      author: {
        name: "David Kim",
        role: "Founding Member in Nottingham",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Best decision for my rental experience."
    },
    {
      id: 14,
      content: "Managing repairs in my property used to be so frustrating. With RentHive, I can track all communication with my landlord in one place and have evidence of when issues were reported.",
      author: {
        name: "Jennifer Lopez",
        role: "RentHive User in Southampton",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Evidence of all maintenance requests with RentHive."
    },
    {
      id: 15,
      content: "The 30-day free trial convinced me to sign up for RentHive, and I quickly upgraded to the yearly plan to save money. It's been an invaluable tool for managing my rental property.",
      author: {
        name: "Mark Williams",
        role: "RentHive User in Belfast",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Upgraded to yearly plan to save money."
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="USER EXPERIENCES"
            title="Hear from RentHive Users"
            description="Real stories from renters across the UK who have used RentHive to improve their rental experience."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <VerticalScrollingTestimonials testimonials={testimonials} />
      </div>
    </section>
  )
}
