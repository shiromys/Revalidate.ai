import Link from 'next/link'
import { FileText, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react'
import BackButton from '../../components/BackButton'

export default function TermsOfServicePage() {
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
              <FileText size={26} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Terms of Service</h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">Effective Date: March 18, 2026</p>
            </div>
          </header>

          <main className="space-y-10 text-zinc-400 leading-relaxed">
            <p className="text-zinc-300 text-lg font-medium">
              Activating account credentials or utilizing our automatic list cleaning parameters constitutes full execution of this service tracking agreement.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-zinc-400" /> 1. Security Warranty Boundaries
              </h2>
              <p>
                Revalidate.ai implements high-grade 256-bit secure socket transmission pathways for all query operations. While we provide advanced verification checks, system owners recognize that target mail server infrastructure configurations evolve dynamically over time and absolute metrics representation remain limited by independent cloud changes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-zinc-400" /> 2. Permitted Platform Usage
              </h2>
              <p>Platform workflows must handle valid opt-in mailing targets within professional compliance terms:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li>Subscribers bear exclusive accountability for aligning target arrays with active compliance mandates.</li>
                <li>Brute-force testing operations that attempt to systematically flood network parameters are strictly barred.</li>
                <li>Falsified records processing that disrupts network state allocations will result in instant profile lockouts.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-zinc-400" /> 3. FTC Compliance & Nature of Service
              </h2>
              <p>
                In strict compliance with transparency disclosures, Revalidate.ai details that system features function exclusively as list data hygiene filtering tools. We offer clear validation indexes but present zero guarantees or implicit warranties regarding conversion open percentages, message response rates, or exact marketing delivery variables.
              </p>
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