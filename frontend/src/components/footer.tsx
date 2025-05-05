import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-700">Acme.ai</h3>
            <p className="text-sm text-gray-500">
              Empowering businesses with powerful AI-driven solutions to automate workflows and gain valuable insights.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-700">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-700">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-700">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-blue-600">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Acme.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 