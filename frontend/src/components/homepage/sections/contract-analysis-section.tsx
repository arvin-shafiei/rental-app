"use client"

import React, { useEffect, useRef, useState } from "react"
import { SectionHeading } from "@/components/ui/section-heading"
import { Check, X, AlertTriangle, FileText, Shield, Info } from "lucide-react"

export default function ContractAnalysisSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showScan, setShowScan] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the container is 40% visible, trigger animation
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Start scanning animation
          setTimeout(() => {
            setShowScan(true);
          }, 1000);
          
          // After scanning animation completes, show results
          setTimeout(() => {
            setShowResults(true);
          }, 4500); // Increased time to allow scan to complete
          
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="w-full py-12 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <SectionHeading
            subtitle="AI-POWERED INSIGHTS"
            title="Instant Contract Analysis"
            description="RentHive uses advanced AI to scan your lease agreements, identifying favorable terms and potential issues in seconds."
            subtitleClassName="text-blue-500"
            titleClassName="text-blue-700"
          />
        </div>

        <div className="relative max-w-5xl mx-auto min-h-[500px] flex flex-col items-center" ref={containerRef}>
          {/* Contract Document that transforms */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg transition-all duration-700 w-full max-w-2xl mx-auto opacity-100">
            {/* Contract Header */}
            <div className="p-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div className="text-lg font-bold text-blue-700">RENTAL AGREEMENT</div>
                </div>
                {!showResults && (
                  <div className="bg-blue-100 px-3 py-1 rounded text-xs font-medium text-blue-700">
                    ANALYZING...
                  </div>
                )}
              </div>
            </div>
            
            {/* Contract Content - Transforms to Analysis */}
            <div className={`relative p-5 transition-all duration-500 ${showResults ? 'min-h-[350px]' : 'min-h-[300px]'}`}>
              {/* Scanner Line - Appears when visible */}
              {showScan && !showResults && (
                <div className="absolute left-0 right-0 w-full h-[300px] overflow-visible">
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 rounded-full z-10" 
                       style={{
                         animation: showScan ? 'moveDown 3s ease-in-out forwards' : 'none',
                         top: 0
                       }}>
                    <div className="absolute -top-2 -left-2 h-4 w-4 bg-blue-500 rounded-full shadow-md"></div>
                    <div className="absolute -top-2 -right-2 h-4 w-4 bg-blue-500 rounded-full shadow-md"></div>
                  </div>
                </div>
              )}
              
              {/* Add the inline style for the animation */}
              <style jsx>{`
                @keyframes moveDown {
                  0% { top: 0; }
                  10% { top: 0; }
                  90% { top: 280px; }
                  100% { top: 300px; opacity: 0; }
                }
              `}</style>
              
              {/* Before Analysis - Placeholder Contract Text */}
              {!showResults && (
                <div className="space-y-5">
                  <div>
                    <div className="h-5 w-36 bg-blue-100 rounded-md mb-2"></div>
                    <div className="h-4 w-full bg-gray-100 rounded-md mb-2"></div>
                    <div className="h-4 w-full bg-gray-100 rounded-md mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-100 rounded-md"></div>
                  </div>
                  
                  <div>
                    <div className="h-5 w-48 bg-green-100 rounded-md mb-2"></div>
                    <div className="h-4 w-full bg-gray-100 rounded-md mb-2"></div>
                    <div className="h-4 w-full bg-gray-100 rounded-md mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-100 rounded-md"></div>
                  </div>
                  
                  <div>
                    <div className="h-5 w-40 bg-red-100 rounded-md mb-2"></div>
                    <div className="h-4 w-full bg-gray-100 rounded-md mb-2"></div>
                    <div className="h-4 w-full bg-gray-100 rounded-md mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-100 rounded-md"></div>
                  </div>
                </div>
              )}
              
              {/* After Analysis - Side by Side Results */}
              {showResults && (
                <div className="flex flex-col">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xl font-bold text-blue-700">Contract Analysis Results</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      RentHive analyzed your lease agreement and identified the following terms and potential issues.
                    </p>
                  </div>
                  
                  <div className="flex flex-row border-t border-b border-gray-200 py-3">
                    {/* Left Side - Positive Terms */}
                    <div className="w-1/2 pr-4">
                      <h4 className="text-green-600 font-medium text-sm mb-3 flex items-center">
                        <Check className="h-4 w-4 mr-1.5 bg-green-100 rounded-full p-0.5" /> 
                        FAVORABLE TERMS
                      </h4>
                      <ul className="text-xs text-gray-700 space-y-2">
                        <li className="bg-green-50 p-2 rounded-md">
                          Landlord responsible for all major repairs
                        </li>
                        <li className="bg-green-50 p-2 rounded-md">
                          30-day notice before any property visits
                        </li>
                        <li className="bg-green-50 p-2 rounded-md">
                          Rent freeze for first 2 years of tenancy
                        </li>
                      </ul>
                    </div>
                    
                    {/* Right Side - Negative Terms */}
                    <div className="w-1/2 pl-4">
                      <h4 className="text-red-600 font-medium text-sm mb-3 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1.5" /> 
                        POTENTIAL ISSUES
                      </h4>
                      <ul className="text-xs text-gray-700 space-y-2">
                        <li className="bg-red-50 p-2 rounded-md">
                          Professional cleaning at end of tenancy (at your cost)
                        </li>
                        <li className="bg-red-50 p-2 rounded-md">
                          High professional costs for breaches
                        </li>
                        <li className="bg-red-50 p-2 rounded-md">
                          Increased deposit for pets
                        </li>
                        <li className="bg-red-50 p-2 rounded-md">
                          High late payment interest (3%+)
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-3">
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors shadow-sm flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Get Yours
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Information Below */}
          <div className="w-full max-w-2xl mx-auto mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mb-2 shadow-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-blue-700 mb-1">Scan Any Contract</h3>
                <p className="text-xs text-gray-700">Upload any rental agreement and get instant analysis.</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mb-2 shadow-sm">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-blue-700 mb-1">Know Your Rights</h3>
                <p className="text-xs text-gray-700">Understand what's fair with legal insights.</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mb-2 shadow-sm">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-blue-700 mb-1">Negotiate Better</h3>
                <p className="text-xs text-gray-700">Get leverage by identifying unfair terms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 