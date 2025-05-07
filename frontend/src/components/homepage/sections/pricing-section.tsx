import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/ui/section-heading"
import { Check } from "lucide-react"

export default function PricingSection() {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="FLEXIBLE PLANS"
            title="Pick Your RentHive Plan"
            description="Choose the perfect plan to manage your rental journey with confidence."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12 max-w-6xl mx-auto">
          {/* Monthly Plan */}
          <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-center text-blue-700 mb-2">MONTHLY</h3>
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">£3.99</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-xs text-center text-gray-500 mb-6">Smooth, expected pricing</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                START 30-DAY FREE TRIAL
              </Button>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Essential tools to help you document and manage your rental property.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Document storage for photos</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Basic repair request templates</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Auto-convert after trial period</p>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Plan - Most Popular */}
          <div className="flex flex-col rounded-xl border-2 border-blue-500 bg-white shadow-lg relative -translate-y-2 md:-translate-y-4">
            <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-1 text-sm font-medium">
              SAVE 30%
            </div>
            <div className="p-6 pt-10">
              <h3 className="text-xl font-bold text-center text-blue-700 mb-2">YEARLY</h3>
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">£2.70</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-xs text-center text-gray-500 mb-6">Billed annually (£32.40)</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                START 30-DAY FREE TRIAL
              </Button>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Save 30% with yearly. All the features at a discounted rate.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Everything in Monthly plan</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Priority customer support</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Advanced document templates</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">No Stripe churn. No fees. No drama.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Founding Member Plan */}
          <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-center text-blue-700 mb-2">FOUNDING MEMBER</h3>
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">£99</span>
                <span className="text-gray-500">/lifetime</span>
              </div>
              <p className="text-xs text-center text-gray-500 mb-6">First 1,000 users only!</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                GET LIFETIME ACCESS
              </Button>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Push HARD EARLY. Cash injection for YOU. Big loyalty anchor for THEM.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Everything in Yearly plan</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Early access to new features</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Ultra-early price: £79 limited time</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Lifetime updates and support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          Free 30-day trial with all plans. Auto-converts to monthly after trial if you don't cancel (low friction).
          <br />You may cancel at any time during the trial period. No credit card required to start.
        </div>
      </div>
    </section>
  )
} 