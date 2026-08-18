import Link from 'next/link'
import { Coins, AlertCircle, BadgePercent, HelpCircle } from 'lucide-react'
import BackButton from '../../components/BackButton'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] font-sans antialiased text-zinc-400 flex flex-col justify-between">
      
      {/* Top Sticky Navigation Ribbon */}
      <div className="w-full max-w-5xl mx-auto px-6 pt-8 flex items-center justify-between text-sm font-semibold text-zinc-400">
        <BackButton label="Back" />
        <span className="text-zinc-500 uppercase tracking-wider text-xs">Revalidate.ai Legal</span>
      </div>

      {/* Central Legal Panel Card */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-12 flex-1">
        <div className="bg-[#111827] border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl space-y-10">
          
          <header className="border-b border-zinc-800 pb-8 flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-800 text-white rounded-2xl flex items-center justify-center border border-zinc-700 shadow-inner shrink-0">
              <Coins size={26} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Terms of Service</h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">Effective Date: March 18, 2026</p>
            </div>
          </header>

          <main className="space-y-10 text-zinc-400 leading-relaxed">
            <p className="text-zinc-300 text-lg font-medium">
              Thank you for trusting Revalidate.ai as your real-time list hygiene engine. Please evaluate the refund conditions applied across our platform balance structures below.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle size={18} className="text-zinc-400" /> 1. As-Is Service Architecture
              </h2>
              <p>
                Our infrastructure provides verification records matching actual live server conditions at runtime. The system remains accessible purely under an as-is state setting, and we make no custom structural guarantees for post-processing changes occurring at destination domains following data download.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BadgePercent size={18} className="text-zinc-400" /> 2. Non-Refundable Balance Allocations
              </h2>
              <p>To align with international credit processing rules for digital hygiene utilities, the following structures govern payments:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li><strong>Instant Server Allocation:</strong> Because credit activations invoke real-time data lookups and automated SMTP server checks immediately, packages are marked fully consumed upon purchase.</li>
                <li><strong>Sales Finality Clause:</strong> Credits added to account ledger profiles are entirely final and non-refundable for performance mismatches resulting from independent outbound marketing variables.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-zinc-400" /> 3. Integrated Compliance Trust Summary
              </h2>
              <p>Our operational pipeline maintains rigorous design protocols ensuring uniform protection standards:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li><strong>Data Minimization Standard:</strong> Purpose-limited query caching protocols paired with automated 24-hour file cleanup routines.</li>
                <li><strong>FTC Disclosure Balance:</strong> Explicitly defined operational boundaries and service disclaimers.</li>
                <li><strong>SSL Protected Transit:</strong> Uniform 256-bit link data wrapping implemented system-wide across all platform dashboards.</li>
              </ul>
            </section>
          </main>

        </div>
      </div>

      {/* MASTER FOOTER */}
      <footer className="bg-[#0B1120] text-zinc-400 py-20 px-6 border-t border-zinc-800 relative z-20 w-full">
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