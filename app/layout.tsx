import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css"; 
import HeaderWrapper from "./components/HeaderWrapper";
import Script from 'next/script';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff", 
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff", 
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Revalidate.ai - AI-Powered Email Verification Platform",
  description: "Validate and clean your email lists in real-time. Remove invalid, disposable, and risky addresses. Improve email deliverability and protect your sender reputation.",
  keywords: ['email validation', 'email verifier', 'SMTP validation', 'email cleaning', 'email verification'],
  openGraph: {
    title: "Revalidate.ai - Real-Time Email Verification",
    description: "Validate and clean your email lists instantly. Protect your sender reputation.",
    url: "https://revalidate.ai",
    siteName: "Revalidate.ai",
    images: [
      {
        url: "https://revalidate.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "Revalidate.ai - Email Verification Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revalidate.ai - AI-Powered Email Verification",
    description: "Validate and clean your email lists in real-time.",
    creator: "@revalidateai",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://revalidate.ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics with your ID: G-PNKXG2MP71 */}
        {/* strategy changed to beforeInteractive so the tag is present in the raw server-rendered HTML — required for Google Search Console's "Google Analytics" domain verification method to detect it */}
        <Script
          strategy="beforeInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-PNKXG2MP71"
        />
        <Script
          id="google-analytics"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-PNKXG2MP71');
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FAFAFA] text-zinc-900`}>
        <HeaderWrapper />
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}