import Link from 'next/link'
import { UploadCloud, ShieldAlert, BarChart3, Check, MailCheck, Layers, Code, Zap, CheckCircle2, Filter } from 'lucide-react'
import CheckoutButton from '../components/CheckoutButton'

export default function LandingPage({
  searchParams,
}: {
  searchParams?: { success?: string; canceled?: string };
}) {
  
  // Pricing Data
  const pricingPlans = [
    { 
      name: "Free Tier", 
      price: "$0", 
      credits: "200", 
      desc: "Best fit for new users", 
      isFree: true 
    },
    { name: "Starter", price: "$5", credits: "500", desc: "Perfect for small, one-off list cleaning.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER as string },
    { name: "Basic", price: "$10", credits: "2,000", desc: "Great for monthly newsletters.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC as string },
    { name: "Professional", price: "$25", credits: "6,000", popular: true, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL as string },
    { name: "Growth", price: "$50", credits: "15,000", desc: "For scaling marketing agencies.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH as string },
    { name: "Advanced", price: "$100", credits: "35,000", desc: "High-volume, daily validation needs.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVANCE as string },
    { name: "Premium", price: "$200", credits: "100,000", desc: "Enterprise-grade processing power.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM as string }
  ];

  // Feature Steps Data
  const featureSteps = [
    {
      title: "Single Validation",
      icon: MailCheck,
      steps: [
        { title: "Input Entry", desc: "User types a single email address into the dashboard." },
        { title: "Syntax Check", desc: "Instantly verifies formatting and traps common typos." },
        { title: "Domain Verification", desc: "Queries DNS to confirm active MX mail records." },
        { title: "Final Delivery Check", desc: "Flags disposable/role emails.", highlight: "+ Full AI: Live SMTP Ping" }
      ]
    },
    {
      title: "Bulk Validation",
      icon: Layers,
      steps: [
        { title: "File Upload", desc: "User uploads a CSV file of up to 100k emails." },
        { title: "Batch Syntax", desc: "Cleans malformed rows and standardizes formats." },
        { title: "Threat Scanning", desc: "Compares domains against known spam trap databases." },
        { title: "Deep Verification", desc: "Resolves all MX records.", highlight: "+ Full AI: Parallel SMTP" }
      ]
    },
    {
      title: "List Cleaning",
      icon: Filter,
      steps: [
        { title: "File Selection", desc: "Choose any previously validated list from your dashboard." },
        { title: "Smart Filtering", desc: "Instantly filter out invalid, disposable, or role-based addresses." },
        { title: "Data Segmentation", desc: "Isolate high-quality emails tailored for your next campaign." },
        { title: "One-Click Export", desc: "Download your perfectly segmented, pristine email CSV.", highlight: "+ SMART SEGMENTATION" }
      ]
    },
    {
      title: "REST API",
      icon: Code,
      badge: "Coming Soon",
      steps: [
        { title: "Endpoint Call", desc: "Your system passes an email payload to our API." },
        { title: "Millisecond Checks", desc: "Runs instant syntax, role, and disposable checks." },
        { title: "Domain Auth", desc: "Verifies the receiving mail server is actively resolving." },
        { title: "JSON Response", desc: "Returns clean data payload.", highlight: "+ Full AI: Sync SMTP" }
      ]
    }
  ];

  // FAQ Data
  const faqs = [
    {
      question: "What exactly does Revalidate.ai do?",
      answer: "We automatically remove invalid addresses, spam traps, and temporary emails from your contact lists to eliminate bounces and maximize email deliverability."
    },
    {
      question: "Will my contacts know I am verifying their email?",
      answer: "No. The entire verification process is completely invisible to your subscribers. We verify internal server metrics without sending any real emails."
    },
    {
      question: "Why is email validation so important?",
      answer: "High bounce rates damage your domain reputation, causing email filters to route your campaigns to the spam folder. Regular list validation ensures you reach active inboxes."
    },
    {
      question: "How do I upload my contacts?",
      answer: "Simply drag and drop your standard CSV mailing lists directly into your user dashboard for automatic processing."
    },
    {
      question: "What kind of bad emails do you catch?",
      answer: "Our system identifies and removes dead addresses, disposable domains, automated spam traps, and generic role-based distribution emails."
    },
    {
      question: "Do my validation credits ever expire?",
      answer: "Never. Purchased verification credits stay securely in your account balance and are valid for lifetime use whenever you need them."
    }
  ];

  return (
    <div className="min-h-screen bg-red-50/40 font-sans antialiased selection:bg-red-100 selection:text-red-900 text-zinc-800 overflow-hidden relative">
      
      {/* STRIPE SUCCESS BANNER */}
      {searchParams?.success && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-500">
          <CheckCircle2 size={24} className="text-emerald-600" />
          <div>
            <p className="font-bold text-sm tracking-tight">Payment Successful!</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">Your test payment was processed in sandbox mode.</p>
          </div>
        </div>
      )}

      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-0 inset-x-0 h-[800px] w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10"></div>

      {/* HERO SECTION */}
      <main className="relative pt-48 pb-32 px-4 flex flex-col items-center justify-center text-center z-10 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-bold tracking-tight text-black leading-[1.1] mb-8 flex flex-col gap-2 md:gap-4 w-full">
          <span>Verify Emails in Real-Time.</span>
          <span className="text-[#8B0000]">Protect Your Sender Reputation.</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
          Improve email deliverability and safeguard your sender reputation with accurate detection of invalid and disposable email addresses.
        </p>
        <Link href="/auth/signup" className="inline-flex items-center justify-center px-10 py-4 rounded-xl text-base font-bold text-white bg-[#8B0000] hover:bg-[#6A0000] transition-all shadow-md active:scale-95">
          Start Verifying for Free
        </Link>
        <p className="mt-5 text-sm font-medium text-zinc-400 flex items-center gap-2">
          No credit card required
        </p>
      </main>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative z-20 bg-white py-24 px-6 border-t border-zinc-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-4">How It Works</h2>
            <p className="text-[#8B0000] font-bold text-lg max-w-2xl mx-auto">Clean your email lists in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-200 hover:border-red-200 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="relative mb-8 flex flex-col items-center mt-2">
                <div className="w-8 h-8 bg-white text-[#8B0000] rounded-full flex items-center justify-center font-bold text-xs absolute -top-3 z-10 shadow-sm border-2 border-[#8B0000] group-hover:bg-[#8B0000] group-hover:text-white transition-colors duration-300">1</div>
                <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm relative z-0">
                  <UploadCloud className="text-[#8B0000] group-hover:scale-105 transition-transform duration-300" size={40} strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-black mb-3 tracking-tight">Upload Your List</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-medium">Drag and drop your massive CSV files, or paste a single email for a quick check. No complex formatting required.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-200 hover:border-red-200 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="relative mb-8 flex flex-col items-center mt-2">
                <div className="w-8 h-8 bg-white text-[#8B0000] rounded-full flex items-center justify-center font-bold text-xs absolute -top-3 z-10 shadow-sm border-2 border-[#8B0000] group-hover:bg-[#8B0000] group-hover:text-white transition-colors duration-300">2</div>
                <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm relative z-0">
                  <ShieldAlert className="text-[#8B0000] group-hover:scale-105 transition-transform duration-300" size={40} strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-black mb-3 tracking-tight">Deep-Level Verification</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-medium">Our engine goes beyond simple syntax checks. We instantly verify DNS/MX records and perform live SMTP server pings to guarantee accuracy.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-200 hover:border-red-200 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="relative mb-8 flex flex-col items-center mt-2">
                <div className="w-8 h-8 bg-white text-[#8B0000] rounded-full flex items-center justify-center font-bold text-xs absolute -top-3 z-10 shadow-sm border-2 border-[#8B0000] group-hover:bg-[#8B0000] group-hover:text-white transition-colors duration-300">3</div>
                <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm relative z-0">
                  <BarChart3 className="text-[#8B0000] group-hover:scale-105 transition-transform duration-300" size={40} strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-black mb-3 tracking-tight">Download Clean Data</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-medium">Get a detailed validation report.
. Download your 100% deliverable, bounce-free email list and launch your campaigns with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* UNDER THE HOOD SECTION */}
      <section id="features" className="relative z-20 bg-red-50/40 py-24 px-6 border-t border-zinc-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-4">Under the Hood</h2>
            <p className="text-[#8B0000] font-bold text-lg max-w-2xl mx-auto">Step-by-step execution for every tool in our arsenal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {featureSteps.map((feature, featureIdx) => (
              <div key={featureIdx} className="bg-white rounded-3xl shadow-sm border border-zinc-200 hover:border-red-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <div className="p-8 bg-gradient-to-b from-red-50/20 to-white border-b border-zinc-100 relative overflow-hidden">
                  
                  {/* Blinking 'Coming Soon' Badge */}
                  {feature.badge && (
                    <div className="absolute top-5 right-5 z-20">
                       <span className="animate-pulse inline-flex items-center bg-red-50 text-[#8B0000] text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-red-200 shadow-sm">
                         {feature.badge}
                       </span>
                    </div>
                  )}

                  <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 group-hover:scale-105 transition-all duration-300 text-[#8B0000]">
                    <feature.icon size={120} strokeWidth={1} />
                  </div>
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-red-100 flex items-center justify-center mb-6 relative z-10 text-[#8B0000] group-hover:scale-105 group-hover:bg-[#8B0000] group-hover:text-white transition-all duration-300">
                    <feature.icon size={24} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-black relative z-10 tracking-tight leading-none pr-4">{feature.title}</h3>
                </div>
                
                <div className="p-6 xl:p-8 pt-8">
                  <div className="relative border-l-2 border-dashed border-red-100 ml-3 space-y-10 pb-2">
                    {feature.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="relative pl-8 xl:pl-8">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 bg-white text-[#8B0000] rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-[#8B0000] shadow-sm group-hover:bg-[#8B0000] group-hover:text-white transition-colors duration-300">
                          0{stepIdx + 1}
                        </div>
                        <div className="-mt-1">
                          <h4 className="text-[15px] font-bold text-black mb-1.5 tracking-tight leading-none">{step.title}</h4>
                          <p className="text-sm font-medium text-zinc-500 leading-relaxed">{step.desc}</p>
                          {step.highlight && (
                            <div className="mt-4 inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-[#8B0000] text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl shadow-sm">
                              <Zap size={14} className="text-[#8B0000] fill-[#8B0000] shrink-0" />
                              {step.highlight}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="relative z-20 bg-white py-24 px-6 border-t border-zinc-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-4">Pricing</h2>
            <p className="text-[#8B0000] font-bold text-lg max-w-2xl mx-auto">Flexible plans that scale with your validation needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-3xl p-8 md:p-10 shadow-sm border-2 border-[#8B0000] transition-all duration-300 flex flex-col group ${plan.popular ? 'scale-105 z-10' : 'hover:-translate-y-1'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 right-8 bg-[#8B0000] text-white text-[10px] font-bold uppercase px-4 py-1.5 rounded-full tracking-widest shadow-sm">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-[2.5rem] font-bold text-black tracking-tight">{plan.price}</span>
                  {!plan.isFree && <span className="text-sm font-bold text-zinc-400">/ one-time</span>}
                </div>
                <p className="text-sm text-zinc-500 mb-8 font-medium h-10">{plan.desc}</p>
                
                {plan.isFree ? (
                  <Link 
                    href="/auth/signup" 
                    className="w-full bg-transparent hover:bg-[#8B0000] text-zinc-800 hover:text-white border border-zinc-200 hover:border-transparent font-bold py-3.5 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                  >
                    Start Now
                  </Link>
                ) : (
                  <CheckoutButton 
                    priceId={plan.priceId as string} 
                    isPopular={plan.popular} 
                    credits={parseInt(plan.credits.replace(/,/g, ''))} 
                  />
                )}

                <div className="pt-8 mt-6 border-t border-zinc-100 flex-1">
                  {plan.isFree ? (
                    <>
                      <p className="text-[15px] font-bold text-black mb-5">Included for new users</p>
                      <div className="space-y-4">
                        <p className="text-sm text-zinc-600 font-medium flex items-center gap-3">
                          <Check className="text-emerald-500 shrink-0" size={20} strokeWidth={3} />
                          <span className="text-black font-bold">100</span> Basic credits given every month
                        </p>
                        <p className="text-sm text-zinc-600 font-medium flex items-center gap-3">
                          <Check className="text-emerald-500 shrink-0" size={20} strokeWidth={3} />
                          <span className="text-black font-bold">100</span> Validation credits given for new users
                        </p>
                        <p className="text-sm text-zinc-600 font-medium flex items-center gap-3">
                          <Check className="text-emerald-500 shrink-0" size={20} strokeWidth={3} />
                          Basic validation test
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] font-bold text-black mb-5">Everything in free plan +</p>
                      <div className="space-y-4">
                        <p className="text-sm text-zinc-600 font-medium flex items-center gap-3">
                          <Check className="text-emerald-500 shrink-0" size={20} strokeWidth={3} />
                          <span className="text-black font-bold">{plan.credits}</span> Validation credits
                        </p>
                        <p className="text-sm text-zinc-600 font-medium flex items-center gap-3">
                          <Check className="text-emerald-500 shrink-0" size={20} strokeWidth={3} />
                          Real-time SMTP validation
                        </p>
                        <p className="text-sm text-zinc-600 font-medium flex items-center gap-3">
                          <Check className="text-emerald-500 shrink-0" size={20} strokeWidth={3} />
                          Credits never expire
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FREE TIERS SECTION */}
          <div className="mt-16 bg-gradient-to-br from-[#500000] via-[#8B0000] to-[#A31414] text-white rounded-[2rem] p-12 md:p-16 shadow-xl text-center relative overflow-hidden">
            <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-red-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-black/20 rounded-full blur-2xl pointer-events-none -translate-x-1/4 translate-y-1/4"></div>
            
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Get started in minutes — it is free</h3>
              <p className="text-base md:text-lg text-red-100/90 max-w-lg mx-auto font-medium leading-relaxed">
                Free forever – the perfect plan to evaluate your domain lists with advanced syntax, live MX checks, and role detection.
              </p>
              
              <div className="pt-4">
                <Link 
                  href="/auth/signup" 
                  className="inline-block px-12 py-4 bg-white text-[#8B0000] font-bold rounded-xl text-base hover:bg-red-50 transition-all shadow-md hover:scale-[1.02] active:scale-95"
                >
                  Try Revalidate.ai for Free
                </Link>
              </div>
              
              <div className="pt-2 flex items-center justify-center text-xs font-semibold text-red-200/80">
                <p>• </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="relative z-20 bg-red-50/40 py-24 px-6 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#8B0000] font-bold text-sm tracking-widest uppercase mb-3">Got Questions?</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black mb-4">Frequently Asked Questions about Revalidate.ai</h2>
            <p className="text-zinc-500 font-medium text-lg">Everything you need to know about AI-powered email validation.</p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-red-100 border-l-4 border-l-[#8B0000] hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-bold text-black mb-3 flex items-start gap-3">
                  <span className="text-[#8B0000] font-extrabold">Q</span>
                  {faq.question}
                </h3>
                <p className="text-zinc-500 font-medium leading-relaxed pl-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER (FIX: Swapped placeholders with active local routing links) */}
      <footer className="bg-[#0B1120] text-zinc-400 py-20 px-6 border-t border-zinc-800 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white tracking-tight">Revalidate.ai</h3>
            <p className="text-sm font-medium leading-relaxed pr-4">
              AI-powered email validation and distribution to help you land your prospects faster and maintain a flawless sender reputation.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/#how-it-works" className="hover:text-white hover:translate-x-1 inline-block transition-all">How It Works</Link></li>
              <li><Link href="/#features" className="hover:text-white hover:translate-x-1 inline-block transition-all">Features</Link></li>
              <li><Link href="/#pricing" className="hover:text-white hover:translate-x-1 inline-block transition-all">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/privacy" className="hover:text-white hover:translate-x-1 inline-block transition-all">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white hover:translate-x-1 inline-block transition-all">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white hover:translate-x-1 inline-block transition-all">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Contact</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="mailto:info@revalidate.ai" className="hover:text-white transition-colors">info@revalidate.ai</a></li>
              <li>(800) 971-8013</li>
              <li className="pt-2">
                <span className="font-bold text-white block mb-1">Address:</span>
                5080 Spectrum Drive,<br />Suite 575E, Addison TX 75001
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-zinc-800/50 text-sm font-medium text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Revalidate.ai - All rights reserved</p>
          <div className="flex gap-4">
             <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 cursor-pointer transition-colors text-xs text-white">in</span>
             <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 cursor-pointer transition-colors text-xs text-white">X</span>
          </div>
        </div>
      </footer>

    </div>
  )
}