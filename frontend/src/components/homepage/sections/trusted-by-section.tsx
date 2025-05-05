import Image from "next/image"

export default function TrustedBySection() {
  const companies = [
    { name: "Dropbox", width: 120 },
    { name: "Uber", width: 80 },
    { name: "Spotify", width: 100 },
    { name: "Google", width: 100 },
    { name: "Microsoft", width: 120 },
    { name: "Amazon", width: 100 },
    { name: "Netflix", width: 100 },
    { name: "YouTube", width: 100 },
  ]

  return (
    <section className="w-full py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <h2 className="text-sm font-medium uppercase tracking-wider text-blue-500">TRUSTED BY LEADING TEAMS</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16 grayscale opacity-70">
            {companies.map((company, index) => (
              <Image
                key={index}
                src={`/placeholder.svg?height=40&width=${company.width}`}
                alt={company.name}
                width={company.width}
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
