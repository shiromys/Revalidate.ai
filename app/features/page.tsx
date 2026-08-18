import Link from 'next/link'
import { MailCheck, Layers, Code, Cpu, CheckCircle2 } from 'lucide-react'
import BackButton from '../../components/BackButton'

export const metadata = {
  title: 'Features | Revalidate.ai',
  description: 'Explore the powerful tools and features Revalidate.ai uses to clean your email lists and protect your sender reputation.',
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-red-50/40 font-sans antialiased pt-10 pb-24 px-6 text-zinc-800 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto space-y-12 flex-1 w-full">
        
        {/* --- TOP-LEFT NAVIGATION BACK BUTTON --- */}
        <div className="flex items-center justify-start">
          <BackButton label="Back to Home" />
        </div>

        {/* --- PAGE HEADER --- */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-950">
            Our Enterprise <span className="text-[#8B0000]">Validation Engine</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 font-medium leading-relaxed">
            Everything you need to instantly clean your lists, drop your bounce rate to zero, and maximize your email marketing ROI.
          </p>
        </div>

        {/* --- 3-COLUMN FEATURE CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Single Verification */}
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-zinc-200 hover:border-red-200 hover:-translate-y-1 transition-all duration-300 flex flex-col group">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100 group-hover:bg-[#8B0000] group-hover:text-white transition-colors duration-300 text-[#8B0000]">
              <MailCheck size={28} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-950 mb-4 tracking-tight">
              Real-Time Single Check
            </h3>
            <p className="text-zinc-500 font-medium leading-relaxed text-sm">
              Verify individual emails instantly right from your dashboard. Perfect for quick checks before sending important one-off messages or high-value sales pitches.
            </p>
          </div>

          {/* Card 2: Bulk Verification */}
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-zinc-200 hover:border-red-200 hover:-translate-y-1 transition-all duration-300 flex flex-col group">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100 group-hover:bg-[#8B0000] group-hover:text-white transition-colors duration-300 text-[#8B0000]">
              <Layers size={28} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-950 mb-4 tracking-tight">
              High-Speed Bulk Cleaning
            </h3>
            <p className="text-zinc-500 font-medium leading-relaxed text-sm">
              Upload massive CSV lists and let our engine clean thousands of emails in minutes. Save time and protect your sender reputation at scale without slowing down your computer.
            </p>
          </div>

          {/* Card 3: REST API */}
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-zinc-200 hover:border-red-200 hover:-translate-y-1 transition-all duration-300 flex flex-col group">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100 group-hover:bg-[#8B0000] group-hover:text-white transition-colors duration-300 text-[#8B0000]">
              <Code size={28} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-950 mb-4 tracking-tight">
              Developer-Friendly API
            </h3>
            <p className="text-zinc-500 font-medium leading-relaxed text-sm">
              Easily connect our real-time validation directly into your own app, CRM, or signup forms to block fake and disposable emails before they ever enter your database.
            </p>
          </div>

        </div>

        {/* --- WIDE TECHNICAL METRICS CARD --- */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-zinc-200 max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8 border-b border-zinc-100 pb-6">
            <div className="text-[#8B0000]">
              <Cpu size={32} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">
              Enterprise-Grade Deliverability Checks
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
              <p className="text-zinc-700 font-medium text-sm">Advanced Syntax & Typo Detection</p>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
              <p className="text-zinc-700 font-medium text-sm">Block Temporary & Disposable Emails</p>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
              <p className="text-zinc-700 font-medium text-sm">Deep Domain & MX Record Verification</p>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
              <p className="text-zinc-700 font-medium text-sm">Live SMTP Inbox Pinging (Zero Emails Sent)</p>
            </div>
          </div>
        </div>

        {/* --- CALL TO ACTION BUTTON --- */}
        <div className="text-center pt-8">
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl text-base font-bold text-white bg-[#8B0000] hover:bg-[#6A0000] transition-all shadow-md active:scale-95"
          >
            Get Access To All Features
          </Link>
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