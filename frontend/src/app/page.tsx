import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <header className="relative sticky top-0 z-50 py-2 bg-background/60 backdrop-blur">
        <div className="flex justify-between items-center container">
          <a title="brand-logo" className="relative mr-6 flex items-center space-x-2" href="/">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-auto h-[40px]">
              <rect width="7" height="7" x="14" y="3" rx="1"></rect>
              <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"></path>
            </svg>
            <span className="font-bold text-xl">acme.ai</span>
          </a>
          <div className="hidden lg:block">
            <div className="flex items-center ">
              <nav className="mr-10">
                <nav aria-label="Main" data-orientation="horizontal" dir="ltr" className="relative z-10 flex max-w-max flex-1 items-center justify-center">
                  <div style={{ position: 'relative' }}>
                    <ul data-orientation="horizontal" className="group flex flex-1 list-none items-center justify-center space-x-1" dir="ltr">
                      <li>
                        <button id="radix-:R34cv6ja:-trigger-radix-:R2r4cv6ja:" data-state="closed" aria-expanded="false" aria-controls="radix-:R34cv6ja:-content-radix-:R2r4cv6ja:" className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[state=open]:bg-primary/10 group" data-radix-collection-item="">
                          Features
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" aria-hidden="true">
                            <path d="m6 9 6 6 6-6"></path>
                          </svg>
                        </button>
                      </li>
                      <li>
                        <button id="radix-:R34cv6ja:-trigger-radix-:R4r4cv6ja:" data-state="closed" aria-expanded="false" aria-controls="radix-:R34cv6ja:-content-radix-:R4r4cv6ja:" className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[state=open]:bg-primary/10 group" data-radix-collection-item="">
                          Solutions
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" aria-hidden="true">
                            <path d="m6 9 6 6 6-6"></path>
                          </svg>
                        </button>
                      </li>
                      <li>
                        <Link className="group inline-flex h-10 w-max items-center justify-center rounded-md  px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[state=open]:bg-primary/10" href="/blog" data-radix-collection-item="">
                          Blog
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="absolute left-0 top-full flex justify-center"></div>
                </nav>
              </nav>
              <div className="gap-2 flex">
                <Link className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" href="/login">
                  Login
                </Link>
                <Link className="items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto text-background flex gap-2" href="/signup">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                    <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"></path>
                  </svg>
                  Get Started for Free
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-2 cursor-pointer block lg:hidden">
            <button type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="radix-:R1kcv6ja:" data-state="closed">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M64 384h384v-42.67H64zm0-106.67h384v-42.66H64zM64 128v42.67h384V128z"></path>
              </svg>
            </button>
          </div>
        </div>
        <hr className="absolute w-full bottom-0 transition-opacity duration-300 ease-in-out opacity-100" />
      </header>

      <section id="hero">
        <div className="relative flex w-full flex-col items-center justify-start px-4 pt-32 sm:px-6 sm:pt-24 md:pt-32 lg:px-8">
          <Link href="/blog/introducing-acme-ai" className="flex w-auto items-center space-x-2 rounded-full bg-primary/20 px-2 py-1 ring-1 ring-accent whitespace-pre" style={{ opacity: 1, willChange: 'auto', transform: 'none' }}>
            <div className="w-fit rounded-full bg-accent px-2 py-0.5 text-center text-xs font-medium text-primary sm:text-sm">📣 Announcement</div>
            <p className="text-xs font-medium text-primary sm:text-sm">Introducing Acme.ai</p>
            <svg width="12" height="12" className="ml-1" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.78141 5.33312L5.20541 1.75712L6.14808 0.814453L11.3334 5.99979L6.14808 11.1851L5.20541 10.2425L8.78141 6.66645H0.666748V5.33312H8.78141Z" fill="hsl(var(--primary))"></path>
            </svg>
          </Link>
          <div className="flex w-full max-w-2xl flex-col space-y-4 overflow-hidden pt-8">
            <h1 className="text-center text-4xl font-medium leading-tight text-foreground sm:text-5xl md:text-6xl" style={{ filter: 'blur(0px)', opacity: 1, willChange: 'auto', transform: 'none' }}>
              <span className="inline-block px-1 md:px-2 text-balance font-semibold" style={{ opacity: 1, willChange: 'auto', transform: 'none' }}>Automate</span>
              <span className="inline-block px-1 md:px-2 text-balance font-semibold" style={{ opacity: 1, willChange: 'auto', transform: 'none' }}>your</span>
              <span className="inline-block px-1 md:px-2 text-balance font-semibold" style={{ opacity: 1, willChange: 'auto', transform: 'none' }}>workflow</span>
              <span className="inline-block px-1 md:px-2 text-balance font-semibold" style={{ opacity: 1, willChange: 'auto', transform: 'none' }}>with AI</span>
            </h1>
            <p className="mx-auto max-w-xl text-center text-lg leading-7 text-muted-foreground sm:text-xl sm:leading-9 text-balance" style={{ opacity: 1, willChange: 'auto', transform: 'none' }}>
              No matter what problem you have, our AI can help you solve it.
            </p>
          </div>
          <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0" style={{ opacity: 1, willChange: 'auto', transform: 'none' }}>
            <Link className="items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto text-background flex gap-2" href="/signup">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"></path>
              </svg>
              Get started for free
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground" style={{ opacity: 1, willChange: 'auto' }}>
            7 day free trial. No credit card required.
          </p>
          <div className="relative mx-auto flex w-full items-center justify-center" style={{ opacity: 1, willChange: 'auto', transform: 'none' }}>
            <div className="relative border rounded-lg shadow-lg max-w-screen-lg mt-16">
              <div className="relative cursor-pointer group rounded-md p-2 ring-1 ring-slate-200/50 dark:bg-gray-900/70 dark:ring-white/10 backdrop-blur-md">
                <Image alt="Hero Video" loading="lazy" width="1920" height="1080" decoding="async" data-nimg="1" className="transition-all duration-200 group-hover:brightness-[0.8] ease-out rounded-md border" style={{ color: 'transparent' }} src="/_next/image?url=%2Fdashboard.png&w=3840&q=75" />
                <div className="absolute inset-0 flex items-center justify-center group-hover:scale-100 scale-[0.9] transition-all duration-200 ease-out rounded-2xl">
                  <div className="z-30 bg-primary/10 flex items-center justify-center rounded-full backdrop-blur-md size-28">
                    <div className="flex items-center justify-center bg-gradient-to-b from-primary/30 to-primary shadow-md rounded-full size-20 transition-all ease-out duration-200 relative group-hover:scale-[1.2] scale-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play size-8 text-white fill-white group-hover:scale-105 scale-100 transition-transform duration-200 ease-out" style={{ filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))' }}>
                        <polygon points="6 3 20 12 6 21 6 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 -bottom-12 h-1/3 bg-gradient-to-t from-background via-background to-transparent lg:h-1/4"></div>
        </div>
      </section>

      <section id="logos">
        <div className="container mx-auto px-4 md:px-8 py-12">
          <h3 className="text-center text-sm font-semibold text-gray-500">TRUSTED BY LEADING TEAMS</h3>
          <div className="relative mt-6">
            {/* Marquee component - Assuming a component or manual implementation exists */}
            <div className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row max-w-full [--duration:40s]">
              {/* Repeated content for marquee effect */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row">
                  <Image alt="Google" loading="lazy" width="112" height="40" decoding="async" data-nimg="1" className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-30" style={{ color: 'transparent' }} src="https://cdn.magicui.design/companies/Google.svg" />
                  <Image alt="Microsoft" loading="lazy" width="112" height="40" decoding="async" data-nimg="1" className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-30" style={{ color: 'transparent' }} src="https://cdn.magicui.design/companies/Microsoft.svg" />
                  <Image alt="Amazon" loading="lazy" width="112" height="40" decoding="async" data-nimg="1" className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-30" style={{ color: 'transparent' }} src="https://cdn.magicui.design/companies/Amazon.svg" />
                  <Image alt="Netflix" loading="lazy" width="112" height="40" decoding="async" data-nimg="1" className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-30" style={{ color: 'transparent' }} src="https://cdn.magicui.design/companies/Netflix.svg" />
                  <Image alt="YouTube" loading="lazy" width="112" height="40" decoding="async" data-nimg="1" className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-30" style={{ color: 'transparent' }} src="https://cdn.magicui.design/companies/YouTube.svg" />
                  <Image alt="Instagram" loading="lazy" width="112" height="40" decoding="async" data-nimg="1" className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-30" style={{ color: 'transparent' }} src="https://cdn.magicui.design/companies/Instagram.svg" />
                  <Image alt="Uber" loading="lazy" width="112" height="40" decoding="async" data-nimg="1" className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-30" style={{ color: 'transparent' }} src="https://cdn.magicui.design/companies/Uber.svg" />
                  <Image alt="Spotify" loading="lazy" width="112" height="40" decoding="async" data-nimg="1" className="h-10 w-28 dark:brightness-0 dark:invert grayscale opacity-30" style={{ color: 'transparent' }} src="https://cdn.magicui.design/companies/Spotify.svg" />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 h-full w-1/3 bg-gradient-to-r from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/3 bg-gradient-to-l from-background"></div>
          </div>
        </div>
      </section>

      <section id="problem">
        <div>
          <div className="relative container mx-auto px-4 py-16 max-w-7xl">
            <div className="text-center space-y-4 pb-6 mx-auto">
              <h2 className="text-sm text-primary font-mono font-medium tracking-wider uppercase">Problem</h2>
              <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl md:text-5xl">Manually entering your data is a hassle.</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {/* Example Problem Card - Repeat or map data as needed */}
              <div style={{ opacity: 1, filter: 'blur(0px)', willChange: 'auto', transform: 'translateY(-6px)' }}>
                <div className="rounded-lg border text-card-foreground bg-background border-none shadow-none">
                  <div className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain w-6 h-6 text-primary">
                        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path>
                        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path>
                        <path d="M14.5 5.5A3.5 3.5 0 0 0 11 9v1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V9a3.5 3.5 0 0 0-3.5-3.5"></path>
                        <path d="M14.5 18.5a3.5 3.5 0 0 0 3.5-3.5V13a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.5a3.5 3.5 0 0 1-3.5 3.5"></path>
                        <path d="M9.5 18.5a3.5 3.5 0 0 1-3.5-3.5V13a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1.5a3.5 3.5 0 0 0 3.5 3.5"></path>
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold">Time Consuming</h4>
                    <p className="text-muted-foreground">Manually entering data takes up valuable time that could be spent on more important tasks.</p>
                  </div>
                </div>
              </div>
              {/* Add more problem cards here */}
            </div>
          </div>
        </div>
      </section>
      {/* Solution Section */}
      <section id="solution" className="bg-muted/30">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="text-center space-y-4 pb-6 mx-auto">
            <h2 className="text-sm text-primary font-mono font-medium tracking-wider uppercase">Solution</h2>
            <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl md:text-5xl">Automate Your Data Entry</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">Our platform streamlines the process, saving you time and reducing errors. Connect your sources and let us handle the rest.</p>
          </div>
          {/* Add solution details or visuals here */}
          <div className="mt-12 text-center">
            <p className="text-lg">[Placeholder for Solution Visual/Diagram]</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="text-center space-y-4 pb-6 mx-auto">
            <h2 className="text-sm text-primary font-mono font-medium tracking-wider uppercase">Features</h2>
            <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl md:text-5xl">What We Offer</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Feature Card 1 */}
            <div className="rounded-lg border text-card-foreground bg-background border-none shadow-lg">
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {/* Placeholder Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-6 h-6 text-primary"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                <h4 className="text-xl font-semibold">Automated Sync</h4>
                <p className="text-muted-foreground">Connect your accounts and automatically sync data without manual input.</p>
              </div>
            </div>
            {/* Feature Card 2 */}
            <div className="rounded-lg border text-card-foreground bg-background border-none shadow-lg">
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {/* Placeholder Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check w-6 h-6 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                </div>
                <h4 className="text-xl font-semibold">Secure & Reliable</h4>
                <p className="text-muted-foreground">Your data is protected with industry-standard security measures.</p>
              </div>
            </div>
            {/* Feature Card 3 */}
            <div className="rounded-lg border text-card-foreground bg-background border-none shadow-lg">
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {/* Placeholder Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3 w-6 h-6 text-primary"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
                </div>
                <h4 className="text-xl font-semibold">Insightful Analytics</h4>
                <p className="text-muted-foreground">Gain valuable insights from your aggregated rental data.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-muted/30">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="text-center space-y-4 pb-6 mx-auto">
            <h2 className="text-sm text-primary font-mono font-medium tracking-wider uppercase">Testimonials</h2>
            <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl md:text-5xl">What Our Users Say</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* Testimonial Card 1 */}
            <div className="rounded-lg border text-card-foreground bg-background border-none shadow-lg p-6">
              <p className="text-muted-foreground italic mb-4">"This app saved me hours each week! No more manual data entry headaches."</p>
              <div className="flex items-center">
                {/* Placeholder Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/20 mr-3"></div>
                <div>
                  <p className="font-semibold">Alex Johnson</p>
                  <p className="text-sm text-muted-foreground">Property Manager</p>
                </div>
              </div>
            </div>
            {/* Testimonial Card 2 */}
            <div className="rounded-lg border text-card-foreground bg-background border-none shadow-lg p-6">
              <p className="text-muted-foreground italic mb-4">"Finally, a simple solution to a complex problem. Highly recommended!"</p>
              <div className="flex items-center">
                {/* Placeholder Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/20 mr-3"></div>
                <div>
                  <p className="font-semibold">Samantha Lee</p>
                  <p className="text-sm text-muted-foreground">Landlord</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta">
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Ready to Simplify Your Workflow?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Sign up today and experience the future of rental data management. Get started in minutes.</p>
          <Link href="/auth" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} RentalApp. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="text-muted-foreground hover:text-primary text-sm">Privacy Policy</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary text-sm">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
