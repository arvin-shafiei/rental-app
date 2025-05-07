import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-700">RentHive</h3>
            <p className="text-sm text-gray-700">
              Empowering renters with smart tools to document, manage, and optimize their rental experience.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-700">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="text-gray-700 hover:text-blue-600">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-gray-700 hover:text-blue-600">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-700 hover:text-blue-600">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-700 hover:text-blue-600">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-700">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-700 hover:text-blue-600">
                  About RentHive
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-700 hover:text-blue-600">
                  Our Team
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-700 hover:text-blue-600">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-700 hover:text-blue-600">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-700">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-700 hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-700 hover:text-blue-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-700 hover:text-blue-600">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-700">
          <p>© {new Date().getFullYear()} RentHive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 