"use client";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client securely on the frontend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [mode, setMode] = useState("basic");
  const [loading, setLoading] = useState(false);

  // 1. Handle File Drop & Parsing
  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);

    // Parsing the CSV file
    Papa.parse(selectedFile, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as string[][];
        
        const extractedEmails = rawData
          .map((row) => row[0]) 
          .filter((email) => email && typeof email === 'string' && email.includes("@"))
          .map(email => email.trim())
          .slice(0, 500); 

        setEmails(extractedEmails);
      }
    }); 
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const startValidation = async () => {
    if (emails.length === 0) return alert("No emails found!");
    setLoading(true);

    try {
      // Fetch active user session securely
      const { data: { session } } = await supabase.auth.getSession();
      
      const activeUserId = session?.user?.id || "57b0079b-1b8a-4f8c-8538-cad8723ed4bb";
      const token = session?.access_token;

      // Send to the backend API route
      const res = await fetch("/api/jobs/bulk", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: activeUserId,
          emails: emails,
          mode: mode,
          fileName: file?.name,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.jobId) {
        alert(`Bulk Job Created! ID: ${data.jobId}`);
      } else {
        throw new Error(data.error || "Failed to process bulk job");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start bulk job";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen text-black bg-white">
      <h1 className="text-2xl font-bold mb-6">Bulk Email Validation</h1>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-10 rounded-xl text-center cursor-pointer transition ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="space-y-2">
            <p className="text-green-600 font-medium text-lg">✅ File Loaded</p>
            <p className="text-sm text-gray-600">{file.name}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600">Drag & drop a CSV file here, or click to select</p>
            <p className="text-xs text-gray-400 font-mono">Format: email@example.com (First Column)</p>
          </div>
        )}
      </div>

      {emails.length > 0 && (
        <div className="mt-8 p-6 border rounded-2xl shadow-sm bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-gray-700">Validation Settings</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
              {emails.length} Emails Found
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setMode("basic")}
              className={`p-4 rounded-xl border-2 transition text-left ${
                mode === "basic" ? "border-blue-500 bg-blue-50" : "border-gray-100"
              }`}
            >
              <p className="font-bold text-blue-900">Basic Mode</p>
              <p className="text-xs text-blue-700/60 mt-1">MX Check only</p>
            </button>
            <button
              onClick={() => setMode("full")}
              className={`p-4 rounded-xl border-2 transition text-left ${
                mode === "full" ? "border-purple-500 bg-purple-50" : "border-gray-100"
              }`}
            >
              <p className="font-bold text-purple-900">Full Mode</p>
              <p className="text-xs text-purple-700/60 mt-1">SMTP Handshake</p>
            </button>
          </div>

          <button
            onClick={startValidation}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-gray-300"
          >
            {loading ? "Creating Job..." : "Start Validation Now"}
          </button>
        </div>
      )}
    </div>
  );
}