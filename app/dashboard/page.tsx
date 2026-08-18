import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CheckoutButton from '@/components/CheckoutButton'
import PendingCheckoutHandler from '@/components/PendingCheckoutHandler' 
import { 
  Wallet, 
  BarChart3,
  MailCheck,
  Layers,
  Filter, 
  Download,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'

export const revalidate = 0;

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  active?: boolean;
}

interface ValidationResult {
  id?: string | number;
  email: string;
  syntax_valid: boolean | null;
  mx_valid: boolean | null;
  not_disposable: boolean | null; 
  not_role_based: boolean | null; 
}

// 24-Hour Expiration Logic
const isFileExpired = (createdAt: string) => {
  if (!createdAt) return false;
  const jobTime = new Date(createdAt).getTime();
  const currentTime = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (currentTime - jobTime) > twentyFourHours;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ showUsage?: string; showAddFunds?: string; success?: string; canceled?: string; session_id?: string }>
}) {
  const params = await searchParams;
  const showUsage = params?.showUsage === 'true';
  const showAddFunds = params?.showAddFunds === 'true'; 
  const isSuccess = params?.success === 'true';
  const isCanceled = params?.canceled === 'true';

  const supabase = createClient()
  
  // 1. FAST AUTH CHECK
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. PARALLEL DATA FETCHING (CONCURRENT QUERIES)
  const [profileRes, jobsRes, historyRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('wallet_credits, monthly_basic_used') 
      .eq('id', user.id)
      .single(),
    supabase
      .from('jobs')
      .select('id, status, file_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    showUsage
      ? supabase
          .from('validation_results') 
          .select('id, email, syntax_valid, mx_valid, not_disposable, not_role_based')
          .eq('user_id', user.id) 
          .limit(100)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const profile = profileRes.data;
  const jobs = jobsRes.data || [];
  
  if (historyRes.error) {
    console.error("🚨 SUPABASE ERROR FETCHING HISTORY:", historyRes.error.message);
  }
  const usageHistory: ValidationResult[] = (historyRes.data as ValidationResult[]) || [];

  const walletBalance = profile?.wallet_credits || 0
  const basicUsed = profile?.monthly_basic_used || 0 
  const usageLimit = 100
  const usagePercent = Math.min((basicUsed / usageLimit) * 100, 100)

  const pricingPlans = [
    { name: "Starter", price: "$5", credits: "500", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER as string },
    { name: "Basic", price: "$10", credits: "2,000", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC as string },
    { name: "Professional", price: "$25", credits: "6,000", popular: true, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL as string },
    { name: "Growth", price: "$50", credits: "15,000", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH as string },
    { name: "Advance", price: "$100", credits: "35,000", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVANCE as string },
    { name: "Premium", price: "$200", credits: "100,000", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM as string },
  ];

  return (
    <div className="space-y-10 relative font-sans selection:bg-red-100 selection:text-red-900 max-w-6xl mx-auto">
      
      <PendingCheckoutHandler />

      {isSuccess && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-5 rounded-2xl shadow-sm flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-500">
          <CheckCircle2 size={26} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-base tracking-tight">Payment Successful!</p>
            <p className="text-sm font-medium opacity-90 mt-0.5">Your available verification credits have been updated.</p>
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-500">
          <AlertCircle size={24} className="text-red-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">Transaction Canceled</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">No changes were made to your account balance.</p>
          </div>
        </div>
      )}

      {/* WALLET BALANCE METRIC PANEL */}
      <div className="w-full">
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-red-50 text-[#8B0000] rounded-2xl flex items-center justify-center border border-red-100 shadow-sm shrink-0">
              <Wallet size={32} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">Available Credits</p>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-950 tracking-tight mt-2">{walletBalance.toLocaleString()} Verification Credits</h2>
            </div>
          </div>
          <Link 
            href="?showAddFunds=true"
            className="bg-[#8B0000] text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-[#6A0000] transition-all shadow-md active:scale-95 text-center sm:w-auto"
          >
            Buy Credits
          </Link>
        </div>
      </div>

      {/* TOOL SELECTOR HUB */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ToolCard icon={<MailCheck size={26}/>} title="Verify Single Email" desc="Instant Lookup" href="/dashboard/single" active />
        <ToolCard icon={<Layers size={26}/>} title="Bulk List Verification" desc="Clean CSV or TXT Lists" href="/dashboard/bulk" />
        <ToolCard icon={<Filter size={26}/>} title="List Cleaning" desc="Filter & Sort Emails" href="/dashboard/sorting" />
      </div>

      {/* FREE TIER ACCOUNT USAGE INDEX */}
      <div className="w-full">
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/30 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
              <BarChart3 size={22} className="text-[#8B0000]" />
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-950">Free Tier Allowance</p>
            </div>
            <div>
              <span className="text-base font-bold text-zinc-700">{basicUsed} / {usageLimit} used</span>
            </div>
          </div>
          
          <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden relative z-10 mb-6">
            <div 
              className="h-full bg-[#8B0000] transition-all duration-1000 rounded-full" 
              style={{ width: `${usagePercent}%` }} 
            />
          </div>
          
          <div className="flex justify-end relative z-10">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider italic text-right">
              Resets automatically on the 1st of every month
            </p>
          </div>
        </div>
      </div>

      {/* RECENT CLEANED LISTS */}
      <section className="bg-white rounded-[2rem] border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/40">
          <h3 className="text-xl font-bold tracking-tight text-zinc-950">Recent Cleaned Lists</h3>
          <button className="text-xs font-bold text-[#8B0000] uppercase hover:text-[#6A0000] tracking-wider transition-colors">View All Files</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                <th className="px-8 py-5">File Name</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {jobs && jobs.length > 0 ? (
                jobs.map((job) => {
                  return (
                    <tr key={job.id} className="hover:bg-zinc-50/40 transition-colors text-base font-semibold">
                      <td className="px-8 py-5 text-zinc-900 font-medium">{job.file_name}</td>
                      <td className="px-8 py-5">
                          <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">{job.status}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end">
                          {job.status === 'COMPLETED' ? (
                            isFileExpired(job.created_at) ? (
                              <span title="Results expired (over 24 hours)" className="text-red-500 text-xs font-bold tracking-wider cursor-not-allowed inline-flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                                EXPIRED
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" x2="12" y1="15" y2="3" />
                                  <line x1="3" x2="21" y1="3" y2="21" stroke="#ef4444" strokeWidth="2.5" />
                                </svg>
                              </span>
                            ) : (
                              <a 
                                href={`/api/bulk-download?jobId=${job.id}`} 
                                download 
                                title="Download Cleaned List"
                                className="text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer p-2 rounded-full hover:bg-emerald-50 inline-flex"
                              >
                                <Download size={22} />
                              </a>
                            )
                          ) : (
                            <span 
                              title="Processing list data..."
                              className="text-zinc-300 cursor-not-allowed p-2 inline-flex"
                            >
                              <Download size={22} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Layers size={54} className="mb-3 text-zinc-300" />
                      <p className="text-base font-medium text-zinc-500">No verification history found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- ADD FUNDS PACKAGES MODAL CANVAS --- */}
      {showAddFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <Link href="/dashboard" className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
          
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200">
            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-zinc-950">Purchase Verification Credits</h3>
                <p className="text-base font-medium text-zinc-500 mt-1">Select a package below. Unused credits never expire.</p>
              </div>
              <Link href="/dashboard" className="p-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-full transition-all text-zinc-400 hover:text-zinc-800 shadow-sm">
                <X size={22} strokeWidth={2.5} />
              </Link>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 bg-zinc-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pricingPlans.map((plan, index) => (
                  <div key={index} className={`relative bg-white rounded-3xl p-8 shadow-sm flex flex-col transition-all duration-300 ${plan.popular ? 'border-2 border-primary shadow-md shadow-red-900/5 z-10 scale-[1.02]' : 'border border-zinc-200 hover:border-red-200 hover:-translate-y-1'}`}>
                    {plan.popular && (
                      <span className="absolute -top-3 right-6 bg-[#8B0000] text-white text-[10px] font-bold uppercase px-4 py-1.5 rounded-full tracking-widest shadow-sm">
                        Best Value
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-zinc-950 mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl font-bold text-zinc-950 tracking-tight">{plan.price}</span>
                      <span className="text-sm font-semibold text-zinc-400">/ USD</span>
                    </div>
                    
                    <p className="text-base font-bold text-zinc-900 flex items-center gap-2.5 mb-8">
                      <span className="w-2 h-2 bg-[#8B0000] rounded-full"></span> {plan.credits} Credits
                    </p>

                    <div className="mt-auto">
                      <CheckoutButton 
                        priceId={plan.priceId} 
                        isPopular={plan.popular} 
                        credits={parseInt(plan.credits.replace(/,/g, ''))} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RECENT SINGLE VALIDATION WORKSPACE --- */}
      {showUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <Link href="/dashboard" className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
          
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 max-h-[85vh] flex flex-col overflow-hidden border border-zinc-200">
            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-zinc-950">Single Lookup Verification History</h3>
                <p className="text-base font-medium text-zinc-500 mt-1">Detailed evaluation log of your single email queries.</p>
              </div>
              <Link href="/dashboard" className="p-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-full transition-all text-zinc-400 hover:text-zinc-800 shadow-sm">
                <X size={22} strokeWidth={2.5} />
              </Link>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
                  <tr className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <th className="px-8 py-5">Verified Email Endpoint</th>
                    <th className="px-4 py-5 text-center">Syntax</th>
                    <th className="px-4 py-5 text-center">MX Status</th>
                    <th className="px-4 py-5 text-center">Deliverable</th>
                    <th className="px-4 py-5 text-center">Corporate Domain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {usageHistory.length > 0 ? (
                    usageHistory.map((item, i) => (
                      <tr key={item.id || i} className="hover:bg-zinc-50/50 transition-colors text-base font-medium text-zinc-800">
                        <td className="px-8 py-5 font-medium">{item.email}</td>
                        <td className="px-4 py-5"><div className="flex justify-center">{item.syntax_valid ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-red-500" />}</div></td>
                        <td className="px-4 py-5"><div className="flex justify-center">{item.mx_valid ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-red-500" />}</div></td>
                        <td className="px-4 py-5"><div className="flex justify-center">{item.not_disposable ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-red-500" />}</div></td>
                        <td className="px-4 py-5"><div className="flex justify-center">{item.not_role_based ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-red-500" />}</div></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <p className="text-base font-medium text-zinc-400 italic">No historical single verification logs found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolCard({ icon, title, desc, href, active = false }: ToolCardProps) {
  return (
    <Link href={href} className="block group">
      <div className={`p-6 rounded-[1.75rem] border transition-all cursor-pointer bg-white shadow-sm h-full flex flex-col justify-center min-h-[140px] ${active ? 'border-[#8B0000] shadow-red-700/5 ring-1 ring-red-700/10' : 'border-zinc-200 hover:border-[#8B0000]'}`}>
        <div className={`${active ? 'text-[#8B0000]' : 'text-zinc-400'} mb-4 group-hover:scale-110 transition-transform group-hover:text-[#8B0000]`}>
          {icon}
        </div>
        <div>
          <p className="font-bold text-lg text-zinc-950 tracking-tight">{title}</p>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">{desc}</p>
        </div>
      </div>
    </Link>
  )
}