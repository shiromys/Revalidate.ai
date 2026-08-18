import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import CheckoutButton from '@/components/CheckoutButton'
import BackButton from '../../components/BackButton'

export const metadata = {
  title: 'Pay-As-You-Go Credit Pricing Packages | Revalidate.ai',
  description: 'Choose flexible, pay-as-you-go credit tiers. No monthly subscriptions, active credits never expire.',
}

export default function PricingPage() {
  const plans = [
    { 
      name: "Free Tier", 
      price: "$0", 
      credits: "200", 
      desc: "Perfect to test our real-time API and dashboard.", 
      isFree: true 
    },
    { name: "Starter", price: "$5", credits: "500", desc: "Perfect for small one-off lists.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER as string },
    { name: "Basic", price: "$10", credits: "2,000", desc: "Great for regular monthly campaigns.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC as string },
    { name: "Professional", price: "$25", credits: "6,000", desc: "Ideal for growing businesses.", popular: true, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL as string },
    { name: "Growth", price: "$50", credits: "15,000", desc: "For scaling marketing teams.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH as string },
    { name: "Advance", price: "$100", credits: "35,000", desc: "High volume validation needs.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVANCE as string },
    { name: "Premium", price: "$200", credits: "100,000", desc: "Enterprise-grade capacity.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM as string },
  ];

  return (
    <div className="min-h-screen bg-red-50/40 font-sans antialiased pt-10 pb-24 px-6 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto space-y-12 flex-1 w-full">
        
        {/* TOP-LEFT BACK BUTTON NAVIGATION */}
        <div className="flex items-center justify-start">
          <BackButton label="Back to Home" />
        </div>

        {/* HEADER SECTION */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900">
            Simple, Transparent <span className="text-red-700">Pricing</span>
          </h2>
          <p className="text-lg text-zinc-500 font-medium max-w-xl mx-auto">
            Flexible plans that scale perfectly with your verification demands.
          </p>
        </div>

        {/* Pricing Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`relative bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border-2 border-[#8B0000] transition-all duration-300 flex flex-col group ${plan.popular ? 'scale-105 z-10' : 'hover:-translate-y-1'}`}>
              {plan.popular && (
                <span className="absolute -top-3 right-8 bg-[#8B0000] text-white text-[10px] font-bold uppercase px-4 py-1.5 rounded-full tracking-widest shadow-sm">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-[2.5rem] font-bold text-zinc-900 tracking-tight">{plan.price}</span>
                {!plan.isFree && <span className="text-sm font-medium text-zinc-400">/ one-time</span>}
              </div>
              <p className="text-sm text-zinc-500 mb-8 font-medium h-10">{plan.desc}</p>
              
              {plan.isFree ? (
                <Link 
                  href="/auth/signup" 
                  className="w-full bg-[#8B0000] hover:bg-[#6A0000] text-white font-bold py-3.5 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95"
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

              <div className="pt-8 mt-6 border-t border-zinc-100 flex-1 space-y-4">
                {plan.isFree ? (
                  <>
                    <p className="text-sm font-bold text-zinc-800">Included for new users</p>
                    <div className="space-y-3 text-sm text-zinc-600 font-medium">
                      <p className="flex items-center gap-3"><Check size={16} className="text-[#8B0000]" /> <span className="font-bold text-zinc-900">100</span> Basic credits given every month</p>
                      <p className="flex items-center gap-3"><Check size={16} className="text-[#8B0000]" /> <span className="font-bold text-zinc-900">100</span> Validation credits given for new users</p>
                      <p className="flex items-center gap-3"><Check size={16} className="text-[#8B0000]" /> Basic validation test</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-zinc-800">Everything in Free +</p>
                    <div className="space-y-3 text-sm text-zinc-600 font-medium">
                      <p className="flex items-center gap-3"><Check size={16} className="text-[#8B0000]" /> <span className="font-bold text-zinc-900">{plan.credits}</span> Verification Credits</p>
                      <p className="flex items-center gap-3"><Check size={16} className="text-[#8B0000]" /> Deep AI SMTP Diagnostics</p>
                      <p className="flex items-center gap-3"><Check size={16} className="text-[#8B0000]" /> Non-Expiring Account Balance</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Technical Overview Feature Highlight */}
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-zinc-200/80 text-center space-y-4 w-full">
          <h3 className="text-xl font-bold text-zinc-900 flex items-center justify-center gap-2">
            <Zap className="text-red-700" size={20} /> Pure Pay-As-You-Go Commitment
          </h3>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Unlike standard SaaS entities that charge monthly subscriptions, Revalidate handles credits seamlessly via single execution deposits. Top up only when lists deploy. Your balances remain completely protected.
          </p>
        </div>

      </div>

      {/* --- MASTER SYSTEM FOOTER --- */}
      <footer className="bg-[#0B1120] text-zinc-400 py-20 px-6 border-t border-zinc-800 relative z-20 w-full mt-24">
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
              <li><Link href="/how-it-works" className="hover:text-white hover:translate-x-1 inline-block transition-all">How It Works</Link></li>
              <li><Link href="/features" className="hover:text-white hover:translate-x-1 inline-block transition-all">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white hover:translate-x-1 inline-block transition-all">Pricing</Link></li>
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
              <li><Link href="/contact" className="hover:text-white transition-colors">info@revalidate.ai</Link></li>
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