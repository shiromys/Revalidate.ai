'use client'

import React, { useState, useEffect } from 'react'
import { UploadCloud, CheckCircle2, FileText, Loader2, X, Activity, ArrowRight, ShieldCheck, Info, XCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [mode, setMode] = useState<string>("basic"); 
  const [loading, setLoading] = useState<boolean>(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const [jobStatus, setJobStatus] = useState<string>("PROCESSING");
  const [apiCompleted, setApiCompleted] = useState<number>(0);

  const [limitReached, setLimitReached] = useState<boolean>(false);
  const [remainingEmails, setRemainingEmails] = useState<string[]>([]);

  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase.auth]);

  const onDrop = (acceptedFiles: File[]) => {
    setLimitReached(false);
    setRemainingEmails([]);
    setApiCompleted(0);
    
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return; 
    
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
      alert("Invalid file format. Please upload a .csv or .txt file.");
      return;
    }

    Papa.parse(selectedFile, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as string[][];
        
        const extractedEmails = rawData
          .map((row) => row[0]) 
          .filter((email) => email && typeof email === 'string' && email.includes("@"))
          .map(email => email.trim());

        if (extractedEmails.length > 500) {
          alert("Please upload only 500 emails, not more than that.");
          setFile(null);
          setEmails([]);
          return;
        }

        if (extractedEmails.length === 0) {
           alert("No valid emails found in the first column of this file.");
           setFile(null);
           return;
        }

        setFile(selectedFile);
        setEmails(extractedEmails);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    noClick: file !== null, 
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setFile(null);
    setEmails([]);
    setLimitReached(false); 
    setRemainingEmails([]);
    setApiCompleted(0);
  };

  const executeValidation = async (targetEmails: string[], targetMode: string) => {
    if (targetEmails.length === 0) return;
    
    if (!userId) {
      alert("Authenticating user, please wait a second...");
      return;
    }
    
    setLoading(true);
    setLimitReached(false); 

    try {
      const res = await fetch("/api/jobs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId, 
          emails: targetEmails,
          mode: targetMode,
          fileName: file?.name,
        }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && (data.status === "LIMIT_REACHED" || data.status === "NO_FUNDS")) {
            setLimitReached(true); 
        } else {
            alert(data.error || "An error occurred during validation.");
        }
        setLoading(false);
        return; 
      }

      if (data.partial) {
         setRemainingEmails(data.remainingEmails);
      } else {
         setRemainingEmails([]);
      }

      if (data.jobId) {
        setActiveJobId(data.jobId);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start bulk job");
      setLoading(false); 
    } 
  };

  const startValidation = () => {
    executeValidation(emails, mode);
  };

  const handleShiftToFull = () => {
      setMode("full");
      setLimitReached(false);
      const emailsToProcess = [...remainingEmails];
      setEmails(emailsToProcess);
      setRemainingEmails([]);
      setActiveJobId(null);
      setApiCompleted(0);
      setJobStatus("PROCESSING");
      executeValidation(emailsToProcess, "full");
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeJobId && jobStatus !== 'COMPLETED') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/status?jobId=${activeJobId}&t=${Date.now()}`, {
            cache: 'no-store'
          });
          const data = await res.json();
          
          if (data.completed !== undefined) {
            setApiCompleted(data.completed);
          }
          
          if (data.status?.toLowerCase() === 'completed' || data.progress === 100) {
            setJobStatus('COMPLETED'); 
          } else if (data.status) {
            setJobStatus(data.status.toUpperCase()); 
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeJobId, jobStatus]);


  if (activeJobId) {
    const isPartial = remainingEmails.length > 0;
    const totalCount = Math.max(emails.length, 1); 
    
    const targetProcessingCount = isPartial ? totalCount - remainingEmails.length : totalCount;
    const isFullyDone = jobStatus === 'COMPLETED';

    const displayTotal = targetProcessingCount;
    const displayCompleted = isFullyDone ? displayTotal : Math.min(apiCompleted, displayTotal);

    let displayProgress = 0;
    if (displayTotal > 0) {
      displayProgress = Math.floor((displayCompleted / displayTotal) * 100);
    }

    if (displayProgress >= 100 && !isFullyDone) {
      displayProgress = 99;
    }

    const displayTitle = isFullyDone && !isPartial
      ? "Validation Complete!" 
      : (isFullyDone && isPartial 
          ? "Validation Pending..." 
          : "Validating Emails...");

    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 pb-8">
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/40 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-sm">
             {isFullyDone ? <CheckCircle2 size={36} /> : <Activity size={36} className="animate-pulse" />}
          </div>
          
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
            {displayTitle}
          </h2>
          <p className="text-sm font-medium text-zinc-500 mb-10">Job ID: <span className="font-mono text-xs bg-zinc-50 px-2 py-1 rounded border border-zinc-100">{activeJobId}</span></p>

          <div className="w-full max-w-md mx-auto bg-zinc-100 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isFullyDone ? 'bg-[#B71C1C]' : 'bg-red-500'}`}
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          
          <p className="text-2xl font-black text-zinc-800">{displayProgress}%</p>
          <p className="text-sm font-semibold text-zinc-500 mt-1">
            {displayCompleted} / {displayTotal} Emails Verified
          </p>

          {isFullyDone && (
            <div className="mt-8 flex flex-col items-center">
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/jobs/download?jobId=${activeJobId}`);
                        if (!res.ok) {
                          alert("⚠️ This file is no longer available. Results are deleted after 24 hours for security.");
                          return;
                        }
                        const blob = await res.blob();
                        setDownloadBlob(blob);
                        setShowWarningModal(true);
                      } catch (err) {
                        console.error(err);
                        alert("Failed to download file.");
                      }
                    }}
                    className="flex-1 bg-[#B71C1C] text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-[#991717] transition shadow-md"
                  >
                    Download CSV Results
                  </button>
                  
                  <button 
                    onClick={() => { window.location.reload(); }} 
                    className="bg-white text-zinc-700 border-2 border-zinc-200 px-6 py-3.5 rounded-xl font-bold text-sm hover:border-zinc-300 transition"
                  >
                    Upload Another
                  </button>
              </div>

              <div className="mt-8 bg-zinc-50 border border-zinc-200/60 p-6 md:p-8 rounded-3xl w-full max-w-xl text-left shadow-sm">
                <h4 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-2">
                  💡 Want a clean list of deliverable emails?
                </h4>
                <p className="text-sm text-zinc-500 mb-5 leading-relaxed font-medium">
                  After your Bulk Validation is complete, download the result file and upload the same file to List Cleaning. List Cleaning will generate a spreadsheet containing only deliverable email addresses, making it ready for outreach.
                </p>
                <Link
                  href="/dashboard/sorting"
                  className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition active:scale-95 shadow-sm"
                >
                  Go to List Cleaning <ArrowRight size={14} />
                </Link>
              </div>

              {showWarningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-2xl max-w-md w-full text-center">
                    <h3 className="text-xl font-bold text-zinc-900 mb-3">Important Notice</h3>
                    
                    <p className="text-sm font-semibold text-zinc-800 mb-8 leading-relaxed">
                      Note: Your results are stored for 24 hours only. Please download them within 24 hours, as they will be permanently deleted afterward.
                    </p>

                    <button
                      onClick={() => {
                        if (!downloadBlob) return;
                        const url = URL.createObjectURL(downloadBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `validation_report_${activeJobId?.slice(0, 6)}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setShowWarningModal(false);
                      }}
                      className="w-full py-3.5 bg-[#B71C1C] hover:bg-[#991717] text-white rounded-xl font-bold text-sm transition shadow-md active:scale-95"
                    >
                      Download Results
                    </button>
                  </div>
                </div>
              )}

              {isPartial && (
                  <div className="mt-6 bg-[#FEF4F4] border border-red-100 p-6 rounded-2xl w-full max-w-md text-left animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                      <h4 className="text-base font-black text-[#5C1A1A] mb-1">
                          {mode === 'basic' ? "Free Tier Exhausted Mid-File" : "Wallet Credits Exhausted Mid-File"}
                      </h4>
                      <p className="text-sm font-medium text-[#8F3333] mb-5 leading-relaxed">
                          We processed the first batch using your available {mode === 'basic' ? 'free' : 'wallet'} credits. You still have <strong>{remainingEmails.length}</strong> emails remaining in this list.
                      </p>
                      
                      <button 
                          onClick={handleShiftToFull}
                          className="w-full bg-[#B71C1C] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#991717] transition shadow-sm"
                      >
                          Shift to Full Validation & Process Remaining
                      </button>
                  </div>
              )}

            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 font-sans pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Bulk Email Validation</h1>
          <p className="text-sm font-medium text-zinc-500">
            Upload your CSV file to verify up to 500 emails at once.
          </p>
          <p className="text-sm font-bold text-red-600 mt-2 inline-block">
            Note: Download the results within 24 hours.
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/40">
          
          <div 
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-3xl py-10 px-8 text-center cursor-pointer transition-all duration-200 
              ${isDragActive ? 'border-red-500 bg-red-50/20 shadow-inner' : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'}
              ${file ? 'border-red-600 bg-red-50/50 cursor-default' : ''}
            `}
          >
            {!file && <input {...getInputProps()} />}
            
            {file ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <button 
                  onClick={clearFile} 
                  className="absolute top-4 right-4 p-2 bg-white text-zinc-400 hover:text-red-600 rounded-full shadow-sm border border-zinc-200 transition-colors z-10"
                >
                  <X size={16} strokeWidth={3} />
                </button>
                <div className="p-3 bg-red-100 text-red-600 rounded-full shadow-sm shadow-red-900/10 mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <p className="text-base font-bold text-zinc-900">{file.name}</p>
                  <div className="flex items-center gap-2 mt-2 px-4 py-1 bg-white border border-zinc-200 rounded-full shadow-sm text-xs font-bold text-zinc-500">
                    <FileText size={14} className="text-red-600" />
                    {emails.length} VALID EMAILS FOUND
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-zinc-100 text-zinc-500 rounded-full">
                  <UploadCloud size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-base font-bold text-zinc-900">
                    {isDragActive ? 'Drop file to upload' : 'Drag & drop or click to upload CSV'}
                  </p>
                  <p className="text-xs font-medium text-zinc-500 mt-1">Must contain an email column</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 mb-8 text-left">
            <h3 className="text-sm font-bold text-zinc-900 mb-4">Select Processing Mode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              
              <div 
                onClick={() => {
                  if (!loading) {
                    setMode("basic");
                    setLimitReached(false);
                  }
                }} 
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${mode === "basic" ? "border-red-600 bg-red-50/30 shadow-md shadow-red-900/5" : "border-zinc-200 hover:border-zinc-300 bg-white"} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-base font-black ${mode === 'basic' ? 'text-red-900' : 'text-zinc-700'}`}>Basic Check</h4>
                  <div className={`w-5 h-5 rounded-full border-[3px] flex items-center justify-center transition-colors ${mode === 'basic' ? 'border-red-600 bg-white' : 'border-zinc-300 bg-transparent'}`}>
                    {mode === 'basic' && <div className="w-2 h-2 rounded-full bg-red-600"></div>}
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-500">Syntax & MX Records. Fastest option.</p>
              </div>
              
              <div 
                onClick={() => {
                  if (!loading) {
                    setMode("full");
                    setLimitReached(false);
                  }
                }} 
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${mode === "full" ? "border-red-600 bg-red-50/30 shadow-md shadow-red-900/5" : "border-zinc-200 hover:border-zinc-300 bg-white"} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-base font-black ${mode === 'full' ? 'text-zinc-900' : 'text-zinc-700'}`}>Full Deep AI</h4>
                  <div className={`w-5 h-5 rounded-full border-[3px] flex items-center justify-center transition-colors ${mode === 'full' ? 'border-red-600 bg-white' : 'border-zinc-300 bg-transparent'}`}>
                    {mode === 'full' && <div className="w-2 h-2 rounded-full bg-red-600"></div>}
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-500">Full SMTP Handshake. High accuracy.</p>
              </div>
            </div>
            
            {/* PRE-VALIDATION CRITERIA GUIDE */}
            <ValidationCriteriaGuide mode={mode as 'basic' | 'full'} />
            
            {limitReached ? (
              <div className="mt-6 bg-[#FEF4F4] border border-red-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-300 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#D32F2F] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-2xl font-black">!</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[#5C1A1A]">
                      {mode === 'basic' ? 'Monthly Basic Limit Reached' : 'Insufficient Wallet Credits'}
                    </h4>
                    <p className="text-sm font-medium text-[#8F3333] mt-1 leading-relaxed">
                      {mode === 'basic' 
                        ? 'Your free Basic Validation credits have been used. Please wait until next month for your free credits to reset, or switch to Full Deep AI mode to use your Wallet Credits.' 
                        : 'You do not have enough Wallet Credits. Please add funds to your wallet to continue using Full Deep AI mode.'}
                    </p>
                  </div>
                </div>
                {mode !== 'basic' && (
                  <a 
                    href="/dashboard?showAddFunds=true" 
                    className="shrink-0 bg-[#B71C1C] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#991717] transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    Add Funds →
                  </a>
                )}
              </div>
            ) : (
              <button 
                onClick={startValidation} 
                disabled={!file || loading} 
                className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-sm tracking-wide transition-all shadow-sm 
                  ${(!file || loading) 
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none' 
                    : 'bg-[#B71C1C] text-white hover:bg-[#991717] hover:shadow-md active:scale-[0.99]'
                  }
                `}
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> QUEUING {emails.length} EMAILS...</>
                ) : (
                  'START VALIDATION NOW'
                )}
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}

// --- PRE-VALIDATION CRITERIA GUIDE ---
function ValidationCriteriaGuide({ mode }: { mode: 'basic' | 'full' }) {
  const checks = [
    {
      id: 'syntax',
      title: '1. Email Format Check',
      pass: 'We check that the email address is written correctly and follows the standard format used by email providers. A properly formatted address is the first step toward successful email delivery.',
      fail: 'This email address isn\'t written in a valid format. Missing characters, extra spaces, or typing mistakes will be flagged.',
      why: 'Incorrectly formatted email addresses cannot receive emails, no matter how good your message is.',
    },
    {
      id: 'mx',
      title: '2. Mail Server Check',
      pass: 'We confirm that the email provider is set up to receive incoming emails. This means the destination is ready to accept messages sent to addresses on this domain.',
      fail: 'We couldn\'t confirm that this email provider is able to receive messages. Emails sent to this address may not be delivered.',
      why: 'If the provider isn\'t accepting emails, your message may never reach the recipient.',
    },
    {
      id: 'disposable',
      title: '3. Temporary Email Check',
      pass: 'We check whether the email comes from a temporary or one-time-use email service. Addresses passing this check are from regular email providers and are not considered disposable.',
      fail: 'The address appears to come from a temporary email service. These inboxes are often short-lived and may not be reliable for ongoing communication.',
      why: 'Temporary email addresses are often abandoned quickly and can lead to poor engagement or higher bounce rates.',
    },
    {
      id: 'role',
      title: '4. Personal vs Shared Inbox Check',
      pass: 'We check whether this looks like a personal email address or a shared business inbox. Addresses passing this appear to belong to an individual rather than a general mailbox like support@ or sales@.',
      fail: 'The address appears to be a shared business mailbox rather than a personal email address. Shared inboxes are commonly used by teams instead of individual people.',
      why: 'Personal email addresses usually lead to better communication and higher response rates.',
    },
  ];

  if (mode === 'full') {
    checks.push({
      id: 'smtp',
      title: '5. Deep AI Mailbox Check (SMTP)',
      pass: "We checked whether the recipient's email service is accepting incoming messages. The mail server responded normally, indicating that this email address appears able to receive emails.",
      fail: "We couldn't confirm that this email address is currently able to receive emails. The mailbox may not exist, may be unavailable, or the email provider may not allow this type of verification.",
      why: 'This helps identify email addresses that are more likely to receive your message successfully, reducing bounce rates and protecting your sender reputation.',
    });
  }

  return (
    <div className="mt-8 mb-6 space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <ShieldCheck className="text-zinc-700" size={20} />
        <h3 className="text-lg font-bold text-zinc-900">
          What we check during validation
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {checks.map((check) => (
          <div key={check.id} className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden relative">
            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-wider mb-4">
              {check.title}
            </h4>

            <div className="space-y-3">
              {/* IF PASSED BLOCK */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-1">If Passed</span>
                  <p className="text-sm font-medium text-emerald-900/80 leading-relaxed">{check.pass}</p>
                </div>
              </div>

              {/* IF FAILED BLOCK */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-red-700 block mb-1">If Failed</span>
                  <p className="text-sm font-medium text-red-900/80 leading-relaxed">{check.fail}</p>
                </div>
              </div>

              {/* WHY IT MATTERS */}
              <div className="flex items-start gap-2 pt-2">
                <Info size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-zinc-600 leading-relaxed">
                  <span className="font-bold text-zinc-900">Why this matters: </span>
                  {check.why}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}