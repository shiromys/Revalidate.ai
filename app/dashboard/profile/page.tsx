"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Lock, History, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================
interface HistoryItem {
    id: string;
    user_id: string;
    type: string;
    target: string;
    count: number;
    mode: string;
    status: string;
    date: string;
}

interface JobData {
    id: string;
    user_id: string;
    file_name: string;
    email_count: number;
    mode: string;
    status: string;
    created_at: string;
}

interface SingleData {
    id: string;
    user_id: string;
    email: string;
    mode: string;
    is_valid: boolean;
    created_at: string;
}

// NOTE: Update these column types if your Supabase table uses different names
interface CleaningData {
    id: string;
    user_id: string;
    file_name: string;
    total_rows: number; 
    status: string;
    created_at: string;
}

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('history');
    
    // Data states
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Password states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStatus, setPasswordStatus] = useState<{ type: 'error' | 'success' | null, msg: string }>({ type: null, msg: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Visibility toggle states
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchUserData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            router.push('/auth/login');
            return;
        }

        // 1. Fetch History (Bulk Jobs)
        const { data: jobsData } = await supabase
            .from('jobs')
            .select('id, user_id, file_name, email_count, mode, created_at, status')
            .eq('user_id', user.id);

        // 2. Fetch History (Single Verifications)
        const { data: singleData } = await supabase
            .from('single_verifications')
            .select('id, user_id, email, mode, is_valid, created_at')
            .eq('user_id', user.id);

        // 3. Fetch History (List Cleaning / Sorting)
        // NOTE: Change 'list_cleaning_jobs' to your actual Supabase table name if it's different!
        const { data: cleaningData } = await supabase
            .from('list_cleaning_jobs') 
            .select('id, user_id, file_name, total_rows, status, created_at')
            .eq('user_id', user.id);

        // DOUBLE-LOCK JAVASCRIPT FILTERING: 
        const myJobs = (jobsData || []).filter((job: JobData) => job.user_id === user.id);
        const mySingles = (singleData || []).filter((single: SingleData) => single.user_id === user.id);
        const myCleaning = (cleaningData || []).filter((job: CleaningData) => job.user_id === user.id);
        
        // Standardize Bulk Jobs
        const formattedJobs: HistoryItem[] = myJobs.map((job: JobData) => ({
            id: job.id,
            user_id: job.user_id,
            type: 'Bulk Upload',
            target: job.file_name,
            count: job.email_count,
            mode: job.mode || 'basic',
            status: job.status,
            date: job.created_at
        }));

        // Standardize Single Checks
        const formattedSingles: HistoryItem[] = mySingles.map((single: SingleData) => ({
            id: single.id,
            user_id: single.user_id,
            type: 'Single Check',
            target: single.email,
            count: 1,
            mode: single.mode || 'basic',
            status: single.is_valid ? 'Valid' : 'Invalid',
            date: single.created_at
        }));

        // Standardize List Cleaning
        const formattedCleaning: HistoryItem[] = myCleaning.map((job: CleaningData) => ({
            id: job.id,
            user_id: job.user_id,
            type: 'List Cleaning',
            target: job.file_name,
            count: job.total_rows || 0,
            mode: 'Sorting/Cleaning',
            status: job.status,
            date: job.created_at
        }));

        // Combine all three arrays and sort by date (newest first)
        const combinedHistory = [...formattedJobs, ...formattedSingles, ...formattedCleaning].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setHistory(combinedHistory);
        setLoading(false);
    }

    async function handlePasswordUpdate(e: React.FormEvent) {
        e.preventDefault();
        setPasswordStatus({ type: null, msg: '' });

        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', msg: 'Passwords do not match.' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordStatus({ type: 'error', msg: 'Password must be at least 6 characters.' });
            return;
        }

        setIsUpdating(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setIsUpdating(false);

        if (error) {
            setPasswordStatus({ type: 'error', msg: error.message });
        } else {
            setPasswordStatus({ type: 'success', msg: 'Password updated successfully! Please use it on your next login.' });
            setNewPassword('');
            setConfirmPassword('');
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
    }

    return (
        <div className="p-8 md:p-12 animate-in fade-in duration-700 bg-[#f8f9fa] min-h-screen font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* HEADER */}
                <div className="flex items-center gap-4 border-b border-zinc-200 pb-6">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
                        <User size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">My Profile</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-1">Manage your account security and history.</p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-4 border-b border-zinc-200">
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-red-600 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                    >
                        <History size={16} /> Activity History
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'security' ? 'border-red-600 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                    >
                        <Lock size={16} /> Security
                    </button>
                </div>

                {/* TAB CONTENT */}
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden min-h-[400px]">
                    
                    {loading ? (
                        <div className="flex justify-center items-center h-64 text-zinc-400">Loading data...</div>
                    ) : (
                        <>
                            {/* HISTORY TAB */}
                            {activeTab === 'history' && (
                                <div>
                                    <div className="p-6 border-b border-zinc-100 bg-zinc-50">
                                        <h3 className="text-lg font-semibold text-zinc-900">Validation History</h3>
                                        <p className="text-sm text-zinc-500">A complete log of all your single checks, bulk uploads, and list cleaning.</p>
                                    </div>
                                    {history.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-500">No activity history found.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-xs font-semibold">
                                                    <tr>
                                                        <th className="px-6 py-4">Date</th>
                                                        <th className="px-6 py-4">Type</th>
                                                        <th className="px-6 py-4">Target (File/Email)</th>
                                                        <th className="px-6 py-4">Mode</th>
                                                        <th className="px-6 py-4 text-right">Result/Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100">
                                                    {history.map((item) => (
                                                        <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                                                            <td className="px-6 py-4 text-zinc-500">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 font-medium text-zinc-900">{item.type}</td>
                                                            <td className="px-6 py-4 text-zinc-600">{item.target}</td>
                                                            <td className="px-6 py-4 text-zinc-500 capitalize">{item.mode}</td>
                                                            <td className="px-6 py-4 text-right font-medium">
                                                                {item.status}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SECURITY TAB */}
                            {activeTab === 'security' && (
                                <div className="p-8 max-w-xl">
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-zinc-900">Update Password</h3>
                                        <p className="text-sm text-zinc-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
                                    </div>

                                    {passwordStatus.type && (
                                        <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${passwordStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                                            {passwordStatus.type === 'error' ? <AlertCircle size={20} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={20} className="shrink-0 mt-0.5" />}
                                            <p className="text-sm font-medium">{passwordStatus.msg}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handlePasswordUpdate} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-700 mb-2">New Password</label>
                                            <div className="relative">
                                                <input 
                                                    type={showNewPassword ? "text" : "password"}
                                                    required
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-2.5 pr-12 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                                                    placeholder="Enter new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                                                >
                                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Confirm New Password</label>
                                            <div className="relative">
                                                <input 
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-4 py-2.5 pr-12 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                                                    placeholder="Confirm your new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isUpdating}
                                            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isUpdating ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}