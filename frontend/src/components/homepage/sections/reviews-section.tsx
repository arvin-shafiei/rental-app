import { SectionHeading } from "@/components/ui/section-heading"
import { VerticalScrollingTestimonials } from "@/components/ui/vertical-scrolling-testimonials"

export default function ReviewsSection() {
  const testimonials = [
    {
      id: 1,
      content: "As a startup, we need to move fast and stay ahead. #CodeAI's automated coding assistant helps us do just that. Our development speed has doubled. Essential tool for any startup.",
      author: {
        name: "Raj Patel",
        role: "Founder & CEO at Startup Grid",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Our development speed has doubled."
    },
    {
      id: 2,
      content: "The AI-driven analytics from #OptimizeInsights have revolutionized our product development cycle. Insights are now more accurate and faster than ever. A game-changer for tech companies.",
      author: {
        name: "Alex Rivera",
        role: "CTO at InnovateTech",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 3,
      content: "Implementing #AIPredictor's customer prediction model has drastically improved our targeting strategy. Seeing a 50% increase in conversion rates. Highly recommend their solutions.",
      author: {
        name: "Samantha Lee",
        role: "Marketing Director at NextGen Solutions",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Seeing a 50% increase in conversion rates."
    },
    {
      id: 4,
      content: "Using #GlobalizeAI for our localization is now seamless and efficient. A must-have for global product teams.",
      author: {
        name: "Emily Chen",
        role: "Product Manager at Digital Wave",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Localization is now seamless and efficient."
    },
    {
      id: 5,
      content: "Leveraging #DataCrunch's AI for our financial models has given us an edge in predictive accuracy. Our investment strategies are now powered by real-time data analytics.",
      author: {
        name: "Michael Brown",
        role: "Data Scientist at FinTech Innovations",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 6,
      content: "#LogiTech's supply chain optimization tools have drastically reduced our operational costs. Efficiency and accuracy in logistics have never been better.",
      author: {
        name: "Linda Wu",
        role: "VP of Operations at LogiChain Solutions",
        avatar: "/placeholder.svg?height=40&width=40"
      }
    },
    {
      id: 7,
      content: "#TrendSpotter's market analysis AI has transformed how we approach fashion trends. Our campaigns are now data-driven with higher customer engagement. Revolutionizing fashion marketing.",
      author: {
        name: "Aisha Khan",
        role: "Chief Marketing Officer at Fashion Forward",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Our campaigns are now data-driven with higher customer engagement."
    },
    {
      id: 8,
      content: "Implementing #MediConnectAI in our patient care systems has improved patient outcomes significantly. Technology and healthcare working hand in hand for better health. A milestone in medical technology.",
      author: {
        name: "Tom Chen",
        role: "Director of IT at HealthTech Solutions",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Technology and healthcare working hand in hand for better health."
    },
    {
      id: 9,
      content: "By integrating #GreenTech's sustainable energy solutions, we've seen a significant reduction in carbon footprint. Leading the way in eco-friendly business practices. Pioneering change in the industry.",
      author: {
        name: "Carlos Gomez",
        role: "Head of R&D at EcoInnovate",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Leading the way in eco-friendly business practices."
    },
    {
      id: 10,
      content: "#DesignPro's AI has streamlined our creative process, enhancing productivity and innovation. Bringing creativity and technology together. A game-changer for creative industries.",
      author: {
        name: "Jake Morrison",
        role: "CTO at SecureNet Tech",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Bringing creativity and technology together."
    },
    {
      id: 11,
      content: "#LearnSmart's AI-driven personalized learning plans have doubled student performance metrics. Education tailored to every learner's needs. Transforming the education landscape.",
      author: {
        name: "Nadia Ali",
        role: "Product Manager at Creative Solutions",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Education tailored to every learner's needs."
    },
    {
      id: 12,
      content: "With #CyberShield's AI-powered security systems, our data protection has been unmatched. Ensuring safety and trust in digital spaces. Redefining cybersecurity standards.",
      author: {
        name: "Sofia Patel",
        role: "CEO at EduTech Innovations",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Ensuring safety and trust in digital spaces."
    },
    // Add more unique testimonials for better column distribution
    {
      id: 13,
      content: "The AI-powered recommendations from #RetailGenius have increased our average order value by 35%. Customer satisfaction is at an all-time high.",
      author: {
        name: "David Kim",
        role: "E-commerce Director at ShopSmart",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Increased our average order value by 35%."
    },
    {
      id: 14,
      content: "#FinanceBrain's predictive analytics has transformed how we approach market forecasting. We're making more informed decisions faster than our competitors.",
      author: {
        name: "Jennifer Lopez",
        role: "Investment Strategist at WealthWise",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "Making more informed decisions faster than our competitors."
    },
    {
      id: 15,
      content: "Our content creation process was revolutionized by #ContentGenius. What used to take days now takes hours, and the quality has improved substantially.",
      author: {
        name: "Mark Williams",
        role: "Content Director at MediaForce",
        avatar: "/placeholder.svg?height=40&width=40"
      },
      highlight: "What used to take days now takes hours."
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="CUSTOMER REVIEWS"
            title="What our customers are saying"
            description="Don't just take our word for it. See what industry professionals have to say about our AI solutions."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <VerticalScrollingTestimonials testimonials={testimonials} />
      </div>
    </section>
  )
}
