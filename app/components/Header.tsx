import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-zinc-100 transition-all">
      <nav className="flex items-center justify-between px-6 py-2.5 max-w-7xl mx-auto">
        
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="relative w-11 h-11">
              <Image 
                src="/logo.png" 
                alt="Revalidate.ai Logo" 
                fill 
                className="object-contain"
                sizes="150px"
                quality={100}
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tighter text-black uppercase cursor-pointer">
              REVALIDATE<span className="text-red-600">.AI</span>
            </span>
          </Link>
        </div>
        
        {/* CHANGED: text-zinc-500 to text-black */}
        <div className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-black">
          <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
          <Link href="/how-it-works" className="hover:text-red-600 transition-colors">How It Works</Link>
          <Link href="/features" className="hover:text-red-600 transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-red-600 transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-red-600 transition-colors">Contact</Link>
          
          <Link href="/auth/login" className="ml-2 text-red-600 border border-red-600 px-6 py-1.5 rounded-full hover:bg-red-50 transition-all text-sm font-bold active:scale-95">
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}