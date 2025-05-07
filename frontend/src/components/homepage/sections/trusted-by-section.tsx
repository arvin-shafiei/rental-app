import Image from "next/image"

export default function TrustedBySection() {
  const organizations = [
    { name: "Renters Association", width: 120 },
    { name: "Property Week", width: 100 },
    { name: "Housing Today", width: 120 },
    { name: "Rental News", width: 100 },
    { name: "Property Technology", width: 140 },
    { name: "RentSmart", width: 100 },
    { name: "Tenant Voice", width: 110 },
    { name: "PropTech Insights", width: 130 },
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <h2 className="text-sm font-medium uppercase tracking-wider text-blue-600">RENTHIVE IS FEATURED IN</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16 grayscale opacity-70">
            {organizations.map((org, index) => (
              <Image
                key={index}
                src={`/placeholder.svg?height=40&width=${org.width}`}
                alt={org.name}
                width={org.width}
                height={40}
                className="h-8 object-contain"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
