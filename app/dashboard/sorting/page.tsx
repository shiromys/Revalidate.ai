'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

type CsvRow = Record<string, string>;

interface SortingMetrics {
    deliverable: number;
    risky: number;
    undeliverable: number;
    duplicate: number;
    total: number;
    isSingleColumn: boolean;
}

export default function EmailSortingPage() {
    const supabase = createClient();
    
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [sortedRows, setSortedRows] = useState<CsvRow[] | null>(null);
    const [metrics, setMetrics] = useState<SortingMetrics | null>(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    
    const [fullSortedCSV, setFullSortedCSV] = useState<string>("");
    const [validOnlyCSV, setValidOnlyCSV] = useState<string>("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setSortedRows(null);
        setMetrics(null);
        setShowWarningModal(false);
        const selectedFile = e.target.files?.[0];
        
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('Please upload a valid CSV file.');
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleUploadAndProcess = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setSortedRows(null);
        setMetrics(null);

        try {
            const fileText = await file.text();
            
            Papa.parse(fileText, {
                header: true,
                skipEmptyLines: true,
                complete: async (results: Papa.ParseResult<CsvRow>) => {
                    const headers: string[] = results.meta?.fields || [];
                    const isSingleColumn = headers.length === 1;
                    
                    let rows: CsvRow[] = [];
                    let emailField = headers[0] || '';

                    if (isSingleColumn) {
                        const isHeaderless = emailField.includes('@');
                        const standardEmailField = 'Email';

                        if (isHeaderless) {
                            rows.push({ [standardEmailField]: emailField }); 
                        }

                        (results.data || []).forEach((row) => {
                            const val = row[emailField];
                            if (val !== undefined && val !== null) {
                                rows.push({ [standardEmailField]: val });
                            }
                        });

                        emailField = standardEmailField; 
                    } else {
                        rows = results.data || [];
                    }

                    if (rows.length > 500) {
                        alert("Please upload only 500 emails, not more than that.");
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        setIsProcessing(false);
                        return;
                    }

                    if (rows.length === 0) {
                        setError("The uploaded CSV file appears to be completely empty.");
                        setIsProcessing(false);
                        return;
                    }

                    let deliverableCount = 0;
                    let riskyCount = 0;
                    let undeliverableCount = 0;
                    let duplicateCount = 0;

                    let finalSortedRows: CsvRow[] = [];
                    let validOrUniqueRows: CsvRow[] = [];

                    if (isSingleColumn) {
                        const seen = new Set<string>();
                        const uniqueRows: CsvRow[] = [];
                        const duplicateRows: CsvRow[] = [];

                        rows.forEach((row) => {
                            const email = (row[emailField] || '').trim();
                            if (!email) return;

                            const emailLower = email.toLowerCase();
                            const newRow = { ...row }; 

                            if (seen.has(emailLower)) {
                                duplicateCount++;
                                newRow['Status'] = 'Duplicate';
                                duplicateRows.push(newRow);
                            } else {
                                seen.add(emailLower);
                                newRow['Status'] = 'Unique';
                                uniqueRows.push(newRow);
                            }
                        });

                        finalSortedRows = [...uniqueRows, ...duplicateRows];
                        validOrUniqueRows = [...uniqueRows];

                    } else {
                        const deliverableRows: CsvRow[] = [];
                        const riskyRows: CsvRow[] = [];
                        const undeliverableRows: CsvRow[] = [];

                        const statusField = headers.find((h: string) => 
                            h.toLowerCase().includes('result') || 
                            h.toLowerCase().includes('status') || 
                            h.toLowerCase().includes('final')
                        ) || headers[1] || headers[0];

                        const verifiedEmailField = headers.find((h: string) => h.toLowerCase().includes('email')) || headers[0];
                        const seen = new Set<string>();

                        rows.forEach((row: CsvRow) => {
                            const emailLower = (row[verifiedEmailField] || '').toLowerCase().trim();
                            if (emailLower) {
                                if (seen.has(emailLower)) duplicateCount++;
                                else seen.add(emailLower);
                            }

                            const statusValue = (row[statusField] || '').toLowerCase().trim();

                            if (statusValue.includes('undeliverable') || statusValue.includes('invalid') || statusValue.includes('bounce')) {
                                undeliverableRows.push(row);
                                undeliverableCount++;
                            } else if (statusValue.includes('deliverable') || statusValue.includes('delivered') || statusValue.includes('valid')) {
                                deliverableRows.push(row);
                                deliverableCount++;
                            } else if (statusValue.includes('risky') || statusValue.includes('catch-all') || statusValue.includes('soft')) {
                                riskyRows.push(row);
                                riskyCount++;
                            } else {
                                undeliverableRows.push(row);
                                undeliverableCount++;
                            }
                        });

                        finalSortedRows = [...deliverableRows, ...riskyRows, ...undeliverableRows];
                        validOrUniqueRows = [...deliverableRows, ...riskyRows];
                    }

                    setFullSortedCSV(Papa.unparse(finalSortedRows));
                    setValidOnlyCSV(Papa.unparse(validOrUniqueRows));

                    setSortedRows(finalSortedRows);
                    setMetrics({
                        deliverable: deliverableCount,
                        risky: riskyCount,
                        undeliverable: undeliverableCount,
                        duplicate: duplicateCount,
                        total: rows.length,
                        isSingleColumn: isSingleColumn
                    });

                    setIsProcessing(false);

                    // ==========================================
                    // DEBUG LOGGING TO SUPABASE HISTORY
                    // ==========================================
                    try {
                        const { data: { user }, error: userError } = await supabase.auth.getUser();
                        
                        if (userError || !user) {
                            console.error("Auth error:", userError);
                        } else {
                            const { error: insertError } = await supabase.from('list_cleaning_jobs').insert({
                                user_id: user.id,
                                file_name: file.name,
                                total_rows: rows.length,
                                status: 'COMPLETED'
                            });

                            if (insertError) {
                                // THIS WILL POP UP AN ALERT WITH THE EXACT REASON IT FAILED
                                alert('Database Blocked the Save: ' + insertError.message);
                                console.error('Supabase Insert Error:', insertError);
                            } else {
                                console.log('Successfully saved to Supabase!');
                            }
                        }
                    } catch (dbError) {
                        console.error('Failed to log sorting history to database:', dbError);
                    }
                    // ==========================================
                }
            });

        } catch (err) {
            console.error(err);
            setError("Failed to execute internal client parsing loop.");
            setIsProcessing(false);
        }
    };

    const triggerDownload = (csvContent: string, outputFilename: string) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const downloadElement = document.createElement('a');
        downloadElement.href = url;
        downloadElement.download = outputFilename;
        document.body.appendChild(downloadElement);
        downloadElement.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(downloadElement);
    };

    const downloadCompleteList = () => {
        if (!fullSortedCSV) return;
        triggerDownload(fullSortedCSV, 'sorted_complete_results.csv');
    };

    const downloadValidOnlyList = () => {
        if (!validOnlyCSV) return;
        triggerDownload(validOnlyCSV, metrics?.isSingleColumn ? 'unique_emails_only.csv' : 'deliverable_and_risky_emails.csv');
    };

    const resetSorterState = () => {
        setFile(null);
        setSortedRows(null);
        setMetrics(null);
        setShowWarningModal(false);
        setFullSortedCSV("");
        setValidOnlyCSV("");
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="animate-in fade-in duration-700 font-sans pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
                
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">List Cleaning</h1>
                    <p className="text-sm font-medium text-zinc-500">
                        Note: upload 500 emails at once
                    </p>
                    <p className="text-sm font-bold text-red-600 mt-2 inline-block">
                        Note: Download the results immediately.
                    </p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/40">
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700">
                            <AlertCircle size={20} className="mt-0.5 shrink-0" />
                            <p className="text-sm font-bold leading-relaxed">{error}</p>
                        </div>
                    )}

                    {metrics && sortedRows && (
                        <div className="space-y-6 mb-8 animate-in fade-in zoom-in-95 duration-400">
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800">
                                <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold">File Cleaned Successfully!</p>
                                    <p className="text-xs font-medium mt-0.5 opacity-90">Review data summaries below and download your preferred list configuration.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-emerald-50/20 border border-zinc-200">
                                    <span className="text-xs font-bold text-emerald-700/70 uppercase tracking-wider block">Deliverable</span>
                                    <span className="text-2xl font-bold text-emerald-600 mt-1 block">
                                        {metrics.isSingleColumn ? "-" : metrics.deliverable}
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <span className="text-xs font-bold text-zinc-400 tracking-wide uppercase block">Risky</span>
                                    <span className="text-2xl font-bold text-amber-600 mt-1 block">
                                        {metrics.isSingleColumn ? "-" : metrics.risky}
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <span className="text-xs font-bold text-zinc-400 tracking-wide uppercase block">Undeliverable</span>
                                    <span className="text-2xl font-bold text-red-600 mt-1 block">
                                        {metrics.isSingleColumn ? "-" : metrics.undeliverable}
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <span className="text-xs font-bold text-zinc-400 tracking-wide uppercase block">Duplicates</span>
                                    <span className="text-2xl font-bold text-zinc-600 mt-1 block">
                                        {metrics.duplicate}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <button
                                    onClick={() => setShowWarningModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#B71C1C] hover:bg-[#991717] text-white font-bold text-sm rounded-xl transition-all shadow-md"
                                >
                                    Download CSV Results
                                </button>
                                <button
                                    onClick={resetSorterState}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 font-bold text-sm rounded-xl transition-all"
                                >
                                    <RefreshCw size={14} /> Upload Another File
                                </button>
                            </div>

                            {/* --- RETENTION WARNING MODAL --- */}
                            {showWarningModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-2xl max-w-md w-full text-center">
                                        <h3 className="text-xl font-bold text-zinc-900 mb-3">Important Notice</h3>
                                        
                                        <p className="text-sm font-semibold text-zinc-800 mb-8 leading-relaxed">
                                            Note: Sorted email results are not stored on our servers. Please download your results immediately after processing is complete.
                                        </p>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => {
                                                    downloadCompleteList();
                                                    setShowWarningModal(false);
                                                }}
                                                className="w-full py-3 bg-[#B71C1C] hover:bg-[#991717] text-white rounded-xl font-bold text-sm transition shadow-sm active:scale-95"
                                            >
                                                Download Sorted Master CSV ({metrics.total})
                                            </button>
                                            <button
                                                onClick={() => {
                                                    downloadValidOnlyList();
                                                    setShowWarningModal(false);
                                                }}
                                                className="w-full py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50/30 transition shadow-sm active:scale-95"
                                            >
                                                {metrics.isSingleColumn 
                                                    ? `Download Unique Emails Only (${metrics.total - metrics.duplicate})`
                                                    : `Download Deliverable + Risky Only (${metrics.deliverable + metrics.risky})`
                                                }
                                            </button>
                                            <button
                                                onClick={() => setShowWarningModal(false)}
                                                className="w-full py-2 text-zinc-400 hover:text-zinc-600 text-xs font-semibold transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!metrics && (
                        <div 
                            onClick={() => !isProcessing && fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-3xl py-12 px-8 text-center cursor-pointer transition-all duration-200 ${
                                file ? 'border-red-600 bg-red-50/50' : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'
                            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input 
                                type="file" 
                                accept=".csv" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                disabled={isProcessing}
                            />
                            
                            {file ? (
                                <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-200">
                                    <div className="p-3 bg-red-100 text-red-600 rounded-full shadow-sm">
                                        <FileSpreadsheet size={32} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-zinc-900">{file.name}</p>
                                        <p className="text-xs font-medium text-zinc-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 bg-zinc-100 text-zinc-50 rounded-full">
                                        <UploadCloud size={32} strokeWidth={1.5} className="text-zinc-500" />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-zinc-900">Click to upload CSV</p>
                                        <p className="text-xs font-medium text-zinc-500 mt-1">Supports raw lists, bounce metrics, or bulk execution results files</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!metrics && (
                        <button
                            onClick={handleUploadAndProcess}
                            disabled={!file || isProcessing}
                            className={`w-full mt-6 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-sm tracking-wide transition-all shadow-sm ${
                                !file || isProcessing 
                                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none' 
                                : 'bg-[#B71C1C] text-white hover:bg-[#991717]'
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" /> SORTING EMAILS...
                                </>
                            ) : (
                                'SORT AND CLEAN LIST NOW'
                            )}
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
}