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
  metadataBase: new URL("https://www.revalidate.ai"),
  title: "Email Verification & Validation Tool | Revalidate.ai",
  description: "Real-time email verification and bulk list cleaning. Detect invalid, disposable and catch-all emails, cut bounces and protect sender reputation. Start free.",
  applicationName: "Revalidate.ai",
  keywords: [
    // Short-tail
    'email verification',
    'email validation',
    'email verifier',
    'email validator',
    'email checker',
    'bulk email verifier',
    'email list cleaning',
    // Long-tail
    'real-time email verification',
    'bulk email validation CSV',
    'clean email list online',
    'email list verification service',
    'SMTP email verification',
    'disposable email detector',
    'catch-all email detection',
    'role-based email detection',
    'reduce email bounce rate',
    'improve email deliverability',
    'protect sender reputation',
    'pay-as-you-go email verification',
    'free email verifier',
  ],
  openGraph: {
    title: "Revalidate.ai - Real-Time Email Verification & List Cleaning",
    description: "Verify single emails or clean bulk CSV lists in real time. Catch invalid, disposable and catch-all addresses and protect your sender reputation.",
    url: "https://www.revalidate.ai",
    siteName: "Revalidate.ai",
    images: [
      {
        url: "https://www.revalidate.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "Revalidate.ai - Email Verification Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revalidate.ai - Email Verification & List Cleaning",
    description: "Verify emails in real time, clean bulk lists and reduce bounces.",
    creator: "@revalidateai",
  },
  robots: {
    index: true,
    follow: true,
  },
  // NOTE: the canonical URL is set on each public page individually.
  // A canonical here would be inherited by every page and point them all at the homepage.
};

// Structured data (JSON-LD) so search engines understand what the site is.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.revalidate.ai/#organization",
      name: "Revalidate.ai",
      url: "https://www.revalidate.ai",
      logo: "https://www.revalidate.ai/logo.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.revalidate.ai/#website",
      url: "https://www.revalidate.ai",
      name: "Revalidate.ai",
      publisher: { "@id": "https://www.revalidate.ai/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Revalidate.ai",
      url: "https://www.revalidate.ai",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Real-time email verification and bulk email list cleaning. Checks syntax, MX records and live SMTP, and detects disposable, role-based and catch-all addresses.",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "0",
        highPrice: "200",
        offerCount: "7",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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