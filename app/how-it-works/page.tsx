import Link from 'next/link'
import { MailCheck, Layers, Filter, BarChart3, Check, ArrowRight, Sparkles } from 'lucide-react'
import BackButton from '../../components/BackButton'

export const metadata = {
  title: 'How It Works | Revalidate.ai',
  description: 'See exactly how Revalidate.ai cleans your email lists, protects your sender reputation, and boosts your email marketing ROI.',
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-red-50/40 font-sans antialiased pt-10 pb-24 px-6 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto space-y-12 flex-1 w-full">
        
        {/* --- TOP-LEFT NAVIGATION BACK BUTTON --- */}
        <div className="flex items-center justify-start">
          <BackButton label="Back to Home" />
        </div>

        {/* --- SYSTEM HEADER --- */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200/80 text-[#8B0000] text-xs font-bold uppercase tracking-widest shadow-sm">
            <Sparkles size={12} className="animate-pulse" /> Behind the Scenes
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-950">
            How <span className="text-[#8B0000]">revalidate.ai</span> works:
          </h1>
        </div>

        {/* --- SECTION 1: SINGLE VALIDATION --- */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-zinc-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-red-50 text-[#8B0000] flex items-center justify-center font-bold text-lg border border-red-100 shadow-sm">
                1
              </span>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B0000]">Real-Time Verification</h2>
                <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">Single Email Check</h3>
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              Drop in a single email address, and our engine instantly goes to work. We automatically check for common typos, verify domain records, and safely ping the inbox to ensure it exists—without ever sending a real email to your contact.
            </p>
            <div className="space-y-2 pt-2 text-xs font-semibold text-zinc-700">
              <p className="flex items-center gap-2"><Check size={14} className="text-emerald-500 stroke-[3]" /> Advanced syntax & typo detection</p>
              <p className="flex items-center gap-2"><Check size={14} className="text-emerald-500 stroke-[3]" /> Live inbox verification without sending an email</p>
            </div>
          </div>
          <div className="lg:col-span-5 bg-zinc-50 rounded-2xl p-8 border border-zinc-200/60 flex flex-col items-center justify-center text-center group">
            <div className="w-20 h-20 bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex items-center justify-center text-[#8B0000] group-hover:scale-105 transition-transform duration-300">
              <MailCheck size={36} strokeWidth={1.5} />
            </div>
            <span className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Instant Results: ~400ms</span>
          </div>
        </div>

        {/* --- SECTION 2: BULK VALIDATION --- */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-zinc-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-red-50 text-[#8B0000] flex items-center justify-center font-bold text-lg border border-red-100 shadow-sm">
                2
              </span>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B0000]">Automated Processing</h2>
                <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">Bulk List Cleaning</h3>
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              Upload your CSV lists and let our background workers handle the heavy lifting. We rapidly process your contacts through multi-layered spam trap detection and live verification, leaving you free to focus on your campaign strategy.
            </p>
            <div className="space-y-2 pt-2 text-xs font-semibold text-zinc-700">
              <p className="flex items-center gap-2"><Check size={14} className="text-emerald-500 stroke-[3]" /> Lightning-fast background processing</p>
              <p className="flex items-center gap-2"><Check size={14} className="text-emerald-500 stroke-[3]" /> Spam trap & disposable email detection</p>
            </div>
          </div>
          <div className="lg:col-span-5 bg-zinc-50 rounded-2xl p-8 border border-zinc-200/60 flex flex-col items-center justify-center text-center group">
            <div className="w-20 h-20 bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex items-center justify-center text-[#8B0000] group-hover:scale-105 transition-transform duration-300">
              <Layers size={36} strokeWidth={1.5} />
            </div>
            <span className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">CSV Support Included</span>
          </div>
        </div>

        {/* --- SECTION 3: EMAIL SORTING --- */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-zinc-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-red-50 text-[#8B0000] flex items-center justify-center font-bold text-lg border border-red-100 shadow-sm">
                3
              </span>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B0000]">Smart Segmentation</h2>
                <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">Intelligent Lead Sorting</h3>
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              We do not just verify—we organize. Our system automatically categorizes your leads, identifying valuable B2B Google Workspace or Outlook domains, and filtering out risky role-based emails (like support@ or info@) that drag down your open rates.
            </p>
            <div className="space-y-2 pt-2 text-xs font-semibold text-zinc-700">
              <p className="flex items-center gap-2"><Check size={14} className="text-emerald-500 stroke-[3]" /> Identify Google Workspace & Outlook domains</p>
              <p className="flex items-center gap-2"><Check size={14} className="text-emerald-500 stroke-[3]" /> Filter out role-based emails (admin@, sales@)</p>
            </div>
          </div>
          <div className="lg:col-span-5 bg-zinc-50 rounded-2xl p-8 border border-zinc-200/60 flex flex-col items-center justify-center text-center group">
            <div className="w-20 h-20 bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex items-center justify-center text-[#8B0000] group-hover:scale-105 transition-transform duration-300">
              <Filter size={36} strokeWidth={1.5} />
            </div>
            <span className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Automatic Categorization</span>
          </div>
        </div>

        {/* --- SECTION 4: RESULT DISPLAY --- */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-zinc-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative overflow-hidden">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-red-50 text-[#8B0000] flex items-center justify-center font-bold text-lg border border-red-100 shadow-sm">
                4
              </span>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#8B0000]">Clear Reporting</h2>
                <h3 className="text-2xl font-bold text-zinc-950 tracking-tight">Actionable Results Dashboard</h3>
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              Watch your list health improve in real-time. Our dashboard gives you a crystal-clear breakdown of valid, invalid, and risky emails. Once processing is complete, download your 100% deliverable list instantly and export it directly to your CRM.
            </p>
            <div className="space-y-2 pt-2 text-xs font-semibold text-zinc-700">
              <p className="flex items-center gap-2">📊 Live status tracking & visual reports</p>
              <p className="flex items-center gap-2">📥 Download clean, deliverable leads instantly</p>
            </div>
          </div>
          
          <div className="lg:col-span-5 bg-zinc-950 text-white rounded-2xl p-6 space-y-4 shadow-inner">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-3">
              <BarChart3 size={18} className="text-red-500" />
              <h4>Dashboard Preview</h4>
            </div>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-zinc-300">Q3_B2B_Leads.csv</span>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-900">COMPLETED</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-zinc-300">Newsletter_Subs.csv</span>
                <span className="bg-amber-950 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-900">PROCESSING</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CALL TO ACTION --- */}
        <div className="text-center pt-4">
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center justify-center gap-2 bg-[#8B0000] text-white px-10 py-4 rounded-xl text-base font-bold hover:bg-[#6A0000] transition-colors shadow-md active:scale-95"
          >
            Start Cleaning Your List Now <ArrowRight size={18} />
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