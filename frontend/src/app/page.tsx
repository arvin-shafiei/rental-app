import Header from "@/components/header"
import HeroSection from "@/components/homepage/sections/hero-section"
import TrustedBySection from "@/components/homepage/sections/trusted-by-section"
import ContractAnalysisSection from "@/components/homepage/sections/contract-analysis-section"
import ProblemSection from "@/components/homepage/sections/problem-section"
import SolutionSection from "@/components/homepage/sections/solution-section"
import HowItWorksSection from "@/components/homepage/sections/how-it-works-section"
import PricingSection from "@/components/homepage/sections/pricing-section"
import ReviewsSection from "@/components/homepage/sections/reviews-section"
import TestimonialSection from "@/components/homepage/sections/testimonial-section"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ContractAnalysisSection />
        <TrustedBySection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <PricingSection />
        <ReviewsSection />
        <TestimonialSection />
      </main>
      <Footer />
    </div>
  )
}
