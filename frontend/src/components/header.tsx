"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700">RentalGuard</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            How It Works
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Pricing
          </Link>
          <Link href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Testimonials
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors">
              Get Started
            </Button>
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-500 hover:text-blue-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4">
          <nav className="container mx-auto px-4 flex flex-col space-y-4">
            <Link 
              href="#features" 
              className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              href="#pricing" 
              className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="#testimonials" 
              className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </Link>
            <div className="pt-2 flex flex-col space-y-3">
              <Link 
                href="/auth" 
                onClick={() => setIsMenuOpen(false)}
              >
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
} 