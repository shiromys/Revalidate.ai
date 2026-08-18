'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, Clock, CheckCircle } from 'lucide-react'
import BackButton from '../../components/BackButton'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    const form = e.currentTarget;
    const formData = new FormData(form)
    
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setIsSuccess(true)
        form?.reset()
      } else {
        setErrorMessage(result.error || 'Something went wrong. Please try again.')
      }
    } catch { 
      setErrorMessage('Network error. Failed to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-red-50/40 pt-10 pb-24 px-4 sm:px-6 lg:px-8 font-sans selection:bg-red-100 selection:text-[#8B0000] flex flex-col justify-between">
      <div className="max-w-4xl mx-auto flex-1 w-full space-y-8">

        {/* --- TOP-LEFT NAVIGATION BACK BUTTON --- */}
        <div className="flex items-center justify-start">
          <BackButton label="Back to Home" />
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight">Get In Touch</h1>
          <p className="mt-4 text-zinc-500 font-medium text-lg">We do love to hear from you. Please fill out the form below or use our contact details.</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white border border-zinc-200 p-8 rounded-2xl flex flex-col items-center text-center shadow-sm hover:border-red-200 hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-red-50 text-[#8B0000] rounded-full flex items-center justify-center mb-4 border border-red-100 group-hover:bg-[#8B0000] group-hover:text-white transition-colors">
              <Mail size={24} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-zinc-900 mb-2 text-lg">Email Us</h3>
            <p className="text-[#8B0000] font-bold text-sm">info@revalidate.ai</p>
          </div>

          <div className="bg-white border border-zinc-200 p-8 rounded-2xl flex flex-col items-center text-center shadow-sm hover:border-red-200 hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-red-50 text-[#8B0000] rounded-full flex items-center justify-center mb-4 border border-red-100 group-hover:bg-[#8B0000] group-hover:text-white transition-colors">
              <Phone size={24} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-zinc-900 mb-2 text-lg">Call Us</h3>
            <p className="text-zinc-400 font-medium text-xs italic">Available for Enterprise</p>
          </div>

          <div className="bg-white border border-zinc-200 p-8 rounded-2xl flex flex-col items-center text-center shadow-sm hover:border-red-200 hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-red-50 text-[#8B0000] rounded-full flex items-center justify-center mb-4 border border-red-100 group-hover:bg-[#8B0000] group-hover:text-white transition-colors">
              <Clock size={24} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-zinc-900 mb-2 text-lg">Business Hours</h3>
            <p className="text-zinc-500 font-medium text-sm">Mon - Fri: 9:00 - 6:00 PM</p>
          </div>
        </div>

        {/* Contact Form Container */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-zinc-200 shadow-sm transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-50/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            {isSuccess ? (
              <div className="py-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                  <CheckCircle size={64} className="text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-4 uppercase tracking-tight">Message Sent!</h2>
                <p className="text-zinc-500 font-medium max-w-md mx-auto mb-10 text-lg">
                  Thank you for reaching out. Our support team will review your ticket and reply to your email shortly.
                </p>
                <button 
                  onClick={() => setIsSuccess(false)} 
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg active:scale-95"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center text-zinc-900 mb-10 uppercase tracking-widest">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-[#8B0000] p-4 rounded-xl text-sm font-bold text-center">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Your Name</label>
                      <input 
                        required 
                        name="name" 
                        type="text" 
                        placeholder="John Doe" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-[#8B0000] focus:ring-4 focus:ring-[#8B0000]/10 transition-all font-medium text-zinc-900" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Your Email</label>
                      <input 
                        required 
                        name="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-[#8B0000] focus:ring-4 focus:ring-[#8B0000]/10 transition-all font-medium text-zinc-900" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Subject</label>
                    <input 
                      required 
                      name="subject" 
                      type="text" 
                      placeholder="How can we help you?" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-[#8B0000] focus:ring-4 focus:ring-[#8B0000]/10 transition-all font-medium text-zinc-900" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Message</label>
                    <textarea 
                      required 
                      name="message" 
                      rows={5} 
                      placeholder="Your message here..." 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-[#8B0000] focus:ring-4 focus:ring-[#8B0000]/10 transition-all font-medium text-zinc-900 resize-none" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#8B0000] hover:bg-[#6A0000] text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-[#8B0000]/20 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>
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