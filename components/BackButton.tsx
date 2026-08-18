"use client";

import Link from "next/link";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({ 
  href = "/", 
  label = "Back to Home" 
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:text-red-700 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl shadow-sm transition-all duration-150 group cursor-pointer"
    >
      <svg
        className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5 text-zinc-500 group-hover:text-red-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      <span>{label}</span>
    </Link>
  );
}