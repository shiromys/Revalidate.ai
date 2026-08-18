import { Resolver } from 'dns/promises';
// 1. IMPORT THE NEW MASSIVE BLOCKLIST
import burnerDomains from 'disposable-email-domains';

// 2. Initialize a custom resolver to bypass ISP/Network blocks
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']); 

// HELPER: Timeout wrapper for DNS queries to prevent the worker from hanging
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
};

// 3. DISPOSABLE DOMAINS BLOCKLIST (Now powered by the npm package)
const DISPOSABLE_DOMAINS = new Set(burnerDomains);

// 4. PRODUCTION-GRADE ROLE-BASED PREFIXES (Expanded)
const ROLE_PREFIXES = new Set([
  // Admin & IT
  'admin', 'administrator', 'webmaster', 'hostmaster', 'postmaster', 'sysadmin', 
  'it', 'system', 'network', 'security', 'abuse', 'compliance', 'privacy','support',
  
  // Support & Contact
  'support', 'help', 'helpdesk', 'contact', 'info', 'hello', 'hi', 'feedback', 
  'mail', 'email', 'inquiries', 'questions', 'replies', 'general',
  
  // Sales & Marketing
  'sales', 'marketing', 'press', 'media', 'pr', 'communications', 'comms', 
  'partners', 'sponsorships', 'affiliates',
  
  // Finance & HR
  'billing', 'accounting', 'accounts', 'finance', 'payroll', 'purchasing', 
  'hr', 'careers', 'jobs', 'recruiting', 'hiring',
  
  // Operations & Logistics
  'ops', 'operations', 'logistics', 'orders', 'returns', 'shipping',
  
  // Team & Office
  'office', 'team', 'staff', 'management', 'board', 'investors', 'desk', 
  'frontdesk', 'reception', 'studio', 'design', 'dev', 'developer', 'engineering',
  
  // Misc & Automated
  'editor', 'events', 'booking', 'reservations',
  'no-reply', 'noreply', 'do-not-reply', 'donotreply', 'auto'
]);

interface CheckResults {
  syntax: boolean;
  mx: boolean;
  disposable: boolean;
  role: boolean;
}

export interface ValidationReport {
  isValid: boolean;
  score: number;
  status: 'Deliverable' | 'Undeliverable' | 'Risky';
  details: CheckResults;
}

/**
 * CORE VALIDATION ENGINE - STRICT MODE (WITH TIMEOUT & NULL MX)
 */
export async function validateEmailLogic(email: string): Promise<ValidationReport> {
  const trimmedEmail = email.trim();
  
  const results: CheckResults = {
    syntax: false,
    mx: false,
    disposable: true, 
    role: false       
  };

  // --- STEP 1: STRICT SYNTAX CHECK ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  results.syntax = emailRegex.test(trimmedEmail);
  
  if (!results.syntax) {
    return formatReport(results);
  }

  const [localPart, domain] = trimmedEmail.toLowerCase().split('@');

  // --- STEP 2: ROLE-BASED DETECTION ---
  results.role = ROLE_PREFIXES.has(localPart);

  // --- STEP 3: DISPOSABLE DOMAIN DETECTION (THE UPGRADE) ---
  // Checks the domain against the 10,000+ item Set.
  // If it IS in the list, results.disposable becomes FALSE (meaning it failed the safety check)
  results.disposable = !DISPOSABLE_DOMAINS.has(domain);

  // --- STEP 4: ROBUST REAL-TIME MX RECORD LOOKUP (DNS) ---
  try {
    // Wrap the DNS lookup in a 3000ms (3-second) timeout
    const mxRecords = await withTimeout(resolver.resolveMx(domain), 3000);
    
    if (mxRecords && mxRecords.length > 0) {
      // Check that at least ONE valid mail server exists that isn't Null or a Loopback
      const isValidMailServer = mxRecords.some(record => {
        const target = record.exchange.toLowerCase();
        const isNullMx = target === '.' || target === '';
        const isLoopback = target.includes('localhost') || target.includes('127.0.0.1');
        
        return !isNullMx && !isLoopback;
      });

      results.mx = isValidMailServer;
    } else {
      results.mx = false;
    }
  } catch (error: unknown) {
    // Handle specific timeouts vs standard DNS errors in a TypeScript-safe way
    if (error instanceof Error && error.message === 'TIMEOUT') {
      console.warn(`DNS Timeout for domain: ${domain}`);
      // In strict mode, a timeout still means we can't verify it, so it fails MX.
      results.mx = false; 
    } else {
      // Standard DNS errors (ENOTFOUND, ENODATA) or other unknown errors
      results.mx = false; 
    }
  }

  // --- THE LOGIC TWEAK ---
  // If the MX check fails (domain is dead), force Disposable to false 
  // so the UI doesn't confusingly show a "Passed" badge for a dead domain.
  if (!results.mx) {
    results.disposable = false;
  }

  return formatReport(results);
}

/**
 * SCORING & STATUS CALCULATOR
 */
function formatReport(checks: CheckResults): ValidationReport {
  let score = 0;
  
  if (checks.syntax) score += 20;
  if (checks.mx) score += 60;
  if (checks.disposable) score += 10;
  if (!checks.role) score += 10;

  let status: 'Deliverable' | 'Undeliverable' | 'Risky' = 'Risky';
  
  // STRICT EVALUATION TWEAK
  if (!checks.syntax || !checks.mx) {
    status = 'Undeliverable'; // Dead domain or bad syntax = 100% Undeliverable
  } else if (checks.syntax && checks.mx && checks.disposable && !checks.role) {
    status = 'Deliverable';   // Perfect email
  } else {
    status = 'Risky';         // Valid MX, but it's a role or disposable
  }

  return {
    isValid: checks.syntax && checks.mx && checks.disposable,
    score,
    status,
    details: checks
  };
}