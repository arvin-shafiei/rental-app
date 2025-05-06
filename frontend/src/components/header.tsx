import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700">Acme.ai</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Features
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Solutions
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Pricing
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Resources
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="auth" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Login
          </Link>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">Get Started</Button>
        </div>
      </div>
    </header>
  )
} 