import Link from 'next/link'
import { Shield, Lock, Eye, Trash2 } from 'lucide-react'
import BackButton from '../../components/BackButton'

export default function PrivacyPolicyPage() {
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
              <Shield size={26} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Privacy Policy</h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">Effective Date: March 18, 2026</p>
            </div>
          </header>

          <main className="space-y-10 text-zinc-400 leading-relaxed">
            <p className="text-zinc-300 text-lg font-medium">
              Revalidate.ai is operated to safeguard confidential verification lists. This policy details our systemic structures for processing transient target strings safely while conforming to premium security baselines.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-zinc-400" /> 1. Data Security & Encryption
              </h2>
              <p>We implement rigid industry-standard structural parameter safeguards to secure data arrays:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li><strong>256-bit SSL Encryption:</strong> Every operational parameter passed dynamically between browser instances or external software connectors is protected across isolated secure transmission sockets.</li>
                <li><strong>Cryptography At-Rest:</strong> Ingested file references are fully protected using secure layer encryption routines throughout the active scanning phase.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trash2 size={18} className="text-zinc-400" /> 2. No Permanent Storage Framework
              </h2>
              <p>To adhere directly to advanced data protection minimization rules, we maintain a automated target eviction process:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li><strong>Transient Cache Pipeline:</strong> Customer list entries are held strictly within transient caching parameters during runtime processing segments.</li>
                <li><strong>Automated 24-Hour Erase Cycle:</strong> Completed array targets are definitively evicted from cached storage tables exactly 24 hours post-ingestion, maintaining zero persistent file records.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye size={18} className="text-zinc-400" /> 3. Data Collections Index
              </h2>
              <p>We trace standard technical metadata scopes strictly to facilitate platform service tracking operations:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li><strong>Identity Properties:</strong> Profile structures capturing secure access emails, operational credit summaries, and validation records.</li>
                <li><strong>Verification Inputs:</strong> Email target data arrays submitted contextually across platform dashboard parameters or API endpoints.</li>
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