import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/ui/section-heading"
import { Check } from "lucide-react"

export default function PricingSection() {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="FLEXIBLE PLANS"
            title="Pick Your Plan"
            description="Choose the perfect plan to help you manage your rental journey with confidence."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
          
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12 max-w-6xl mx-auto">
          {/* Basic Plan */}
          <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-center text-blue-700 mb-2">BASIC</h3>
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">£4.99</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-xs text-center text-gray-500 mb-6">+ APPLICABLE TAXES</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                START 7-DAY FREE TRIAL
              </Button>
              <p className="text-xs text-center mt-2 text-blue-600 hover:underline cursor-pointer">
                SKIP FREE TRIAL
              </p>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Essential tools to help you document and track your rental experience.
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
                  <p className="text-sm text-gray-600">Move-in/move-out checklists</p>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Plan - Most Popular */}
          <div className="flex flex-col rounded-xl border-2 border-blue-500 bg-white shadow-lg relative -translate-y-2 md:-translate-y-4">
            <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-1 text-sm font-medium">
              MOST POPULAR
            </div>
            <div className="p-6 pt-10">
              <h3 className="text-xl font-bold text-center text-blue-700 mb-2">STANDARD</h3>
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">£8.99</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-xs text-center text-gray-500 mb-6">+ APPLICABLE TAXES</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                START 7-DAY FREE TRIAL
              </Button>
              <p className="text-xs text-center mt-2 text-blue-600 hover:underline cursor-pointer">
                SKIP FREE TRIAL
              </p>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Enhanced tools and features to help you communicate with landlords effectively.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Everything in Basic plan</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Advanced repair request builder</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Deposit protection tracking</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Legal document templates</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Contract analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-center text-blue-700 mb-2">PREMIUM</h3>
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">£12.99</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-xs text-center text-gray-500 mb-6">+ APPLICABLE TAXES</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                START 7-DAY FREE TRIAL
              </Button>
              <p className="text-xs text-center mt-2 text-blue-600 hover:underline cursor-pointer">
                SKIP FREE TRIAL
              </p>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Complete toolkit with premium features for maximum protection and support.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Everything in Standard plan</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Priority support from legal experts</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Rent comparison tool</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Advanced flatmate agreement builder</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Unlimited document storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          Plan automatically renews after trial period at the price selected in the plan comparison. You may cancel at any time.
          <br />Restrictions and other terms apply, including changes to price and content/features.
        </div>
      </div>
    </section>
  )
} 