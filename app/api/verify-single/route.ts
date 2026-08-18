/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
 
import { Resolver } from 'dns/promises';
 
import { createClient } from '@/lib/supabase/server';
 
const dnsResolver = new Resolver();
 
// Use environment variable or default to public DNS
 
const DNS_SERVERS = process.env.DNS_SERVERS
 
  ? process.env.DNS_SERVERS.split(',').map(s => s.trim())
 
  : ['1.1.1.1', '8.8.8.8'];
 
dnsResolver.setServers(DNS_SERVERS);
 
/**
 
* Disposable domain list from environment or hardcoded defaults
 
* This allows easy updates via environment variables
 
*/
 
const DISPOSABLE_DOMAINS = new Set(
 
  (process.env.DISPOSABLE_DOMAINS
 
    ? process.env.DISPOSABLE_DOMAINS.split(',').map(d => d.trim().toLowerCase())
 
    : [
 
      'mailinator.com',
 
      '10minutemail.com',
 
      'guerrillamail.com',
 
      'yopmail.com',
 
      'tempmail.com',
 
      'burnermail.io',
 
      'temp-mail.org',
 
      'throwaway.email',
 
    ]
 
  ).filter(d => d.length > 0)
 
);
 
/**
 
* Role-based email prefixes
 
* These typically indicate generic mailboxes rather than real users
 
*/
 
const ROLE_PREFIXES = new Set(
 
  (process.env.ROLE_EMAIL_PREFIXES
 
    ? process.env.ROLE_EMAIL_PREFIXES.split(',').map(r => r.trim().toLowerCase())
 
    : [
 
      'admin',
 
      'support',
 
      'info',
 
      'sales',
 
      'contact',
 
      'jobs',
 
      'marketing',
 
      'billing',
 
      'help',
 
      'team',
 
      'office',
 
      'noreply',
 
      'no-reply',
 
    ]
 
  ).filter(r => r.length > 0)
 
);
 
/**
 
* Configuration constants (from environment variables)
 
*/
 
const CONFIG = {
 
  FREE_TIER_LIMIT: parseInt(process.env.FREE_TIER_LIMIT || '100'),
 
  BACKEND_URL: process.env.REVALIDATE_BACKEND_URL || 'http://5.78.65.28:3000',
 
  BACKEND_TIMEOUT: parseInt(process.env.BACKEND_TIMEOUT || '45000'),
 
  CERTAINTY_THRESHOLD_VALID: parseFloat(process.env.CERTAINTY_THRESHOLD_VALID || '0.7'),
 
  LOG_RESPONSES: process.env.LOG_BACKEND_RESPONSES === 'true',
 
};
 
/**
 
* Interface for responses from backend SMTP validator
 
* Supports multiple naming conventions for flexibility
 
*/
 
interface BackendValidationReport {
 
  valid?: boolean;
 
  isValid?: boolean;
 
  is_valid?: boolean;
 
  deliverable?: boolean;
 
  status?: string;
 
  result?: string;
 
  syntaxValid?: boolean;
 
  mxValid?: boolean;
 
  disposableValid?: boolean;
 
  roleValid?: boolean;
 
  catchAll?: boolean;
 
  CatchAll?: boolean;
 
  isCatchAll?: boolean;
 
  catch_all?: boolean;
 
  validationCertainty?: number;
 
  smtpCode?: string;
 
  validationDetails?: Record<string, unknown>;
 
  reason?: string;
 
  [key: string]: unknown;
 
}
 
/**
 
* Profile update payload interface
 
*/
 
interface ProfileUpdatePayload {
 
  monthly_basic_used?: number;
 
  wallet_credits?: number;
 
}
 
/**
 
* Check if domain has MX records
 
*/
 
async function checkMXRecords(domain: string): Promise<boolean> {
 
  try {
 
    const addresses = await dnsResolver.resolveMx(domain);
 
    return addresses && addresses.length > 0;
 
  } catch {
 
    try {
 
      const aAddresses = await dnsResolver.resolve4(domain);
 
      return aAddresses && aAddresses.length > 0;
 
    } catch {
 
      return false;
 
    }
 
  }
 
}
 
/**
 
* Validate email syntax with regex
 
*/
 
function validateSyntax(email: string): boolean {
 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
  return emailRegex.test(email);
 
}
 
/**
 
* Check if domain is in disposable domains list
 
*/
 
function isDisposableDomain(domain: string): boolean {
 
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
 
}
 
/**
 
* Check if email prefix is a role-based account
 
*/
 
function isRoleBasedEmail(prefix: string): boolean {
 
  return ROLE_PREFIXES.has(prefix.toLowerCase());
 
}
 
/**
 
* Extract validity from backend report with flexible parsing
 
* Handles multiple response formats
 
*/
 
function extractValidity(report: BackendValidationReport): boolean {
 
  // Direct boolean checks (most reliable)
 
  if (report.valid === true) return true;
 
  if (report.isValid === true) return true;
 
  if (report.is_valid === true) return true;
 
  if (report.deliverable === true) return true;
 
  // String parsing (for cases where response is stringified)
 
  const validStr = String(report.valid).toLowerCase();
 
  const isValidStr = String(report.isValid).toLowerCase();
 
  const isValidSnakeStr = String(report.is_valid).toLowerCase();
 
  if (validStr === 'true') return true;
 
  if (isValidStr === 'true') return true;
 
  if (isValidSnakeStr === 'true') return true;
 
  // Status/result parsing
 
  const statusStr = String(report.status || report.result || '').toLowerCase();
 
  if (['valid', 'deliverable', 'success', 'ok'].includes(statusStr)) return true;
 
  // If none of the above, it's not valid
 
  return false;
 
}
 
/**
 
* Extract catch-all flag from backend report
 
* Handles multiple naming conventions
 
*/
 
function extractCatchAll(report: BackendValidationReport): boolean {
 
  return (
 
    report.catchAll === true ||
 
    report.CatchAll === true ||
 
    report.isCatchAll === true ||
 
    report.catch_all === true
 
  );
 
}
 
/**
 
* Extract certainty/confidence score from report
 
* Default to 1.0 (certain) if not provided
 
*/
 
function extractCertainty(report: BackendValidationReport): number {
 
  const certainty = report.validationCertainty;
 
  if (typeof certainty === 'number' && certainty >= 0 && certainty <= 1) {
 
    return certainty;
 
  }
 
  return 1.0; // Default: certain
 
}
 
/**
 
* Main email validation endpoint
 
* Supports both BASIC (syntax + MX) and FULL (SMTP) validation modes
 
*/
 
export async function POST(request: Request) {
 
  try {
 
    const supabase = createClient();
 
    const { data: { user } } = await supabase.auth.getUser();
 
    if (!user) {
 
      return NextResponse.json(
 
        { error: 'Unauthorized user session.' },
 
        { status: 401 }
 
      );
 
    }
 
    // Get user profile
 
    let { data: profile } = await supabase
 
      .from('profiles')
 
      .select('wallet_credits, monthly_basic_used')
 
      .eq('id', user.id)
 
      .maybeSingle();
 
    // Auto-provision profile if missing
 
    if (!profile) {
 
      try {
 
        const { data } = await supabase
 
          .from('profiles')
 
          .insert([{ id: user.id, wallet_credits: 0, monthly_basic_used: 0 }])
 
          .select()
 
          .maybeSingle();
 
        if (data) profile = data;
 
      } catch (dbError) {
 
        console.warn("Auto-provision skipped:", dbError);
 
      }
 
    }
 
    const currentWalletCredits = profile?.wallet_credits ?? 0;
 
    const currentMonthlyBasicUsed = profile?.monthly_basic_used ?? 0;
 
    // Parse request
 
    const { email, mode } = await request.json();
 
    if (!email) {
 
      return NextResponse.json(
 
        { error: 'Email parameter is missing' },
 
        { status: 400 }
 
      );
 
    }
 
    // Check usage limits
 
    if (mode === 'basic') {
 
      if (currentMonthlyBasicUsed >= CONFIG.FREE_TIER_LIMIT) {
 
        return NextResponse.json(
 
          {
 
            error: 'Limit reached.',
 
            details: `Monthly free tier allowance (${CONFIG.FREE_TIER_LIMIT}) exhausted.`,
 
          },
 
          { status: 403 }
 
        );
 
      }
 
    } else {
 
      if (currentWalletCredits <= 0) {
 
        return NextResponse.json(
 
          { error: 'Limit reached.', details: 'Please purchase more credits.' },
 
          { status: 403 }
 
        );
 
      }
 
    }
 
    // Normalize and parse email
 
    const isSyntaxValid = validateSyntax(email);
 
    const normalizedEmail = email.toLowerCase().trim();
 
    const [prefix, domain] = normalizedEmail.split('@');
 
    const isDisposable = domain ? isDisposableDomain(domain) : false;
 
    const isRoleBased = prefix ? isRoleBasedEmail(prefix) : false;
 
    let resultPayload: Record<string, unknown> = {};
 
    // ========== BASIC MODE VALIDATION ==========
 
    if (mode === 'basic') {
 
      if (!isSyntaxValid || !domain) {
 
        resultPayload = {
 
          valid: false,
 
          syntaxValid: false,
 
          mxValid: false,
 
          disposableValid: false,
 
          roleValid: !isRoleBased,
 
          catchAll: false,
 
          customStatus: 'Undeliverable',
 
          reason: 'Invalid Syntax or Domain',
 
        };
 
      } else {
 
        const isMxValid = await checkMXRecords(domain);
 
        const isOverallValid = isSyntaxValid && isMxValid && !isDisposable;
 
        let customStatus = 'Undeliverable';
 
        if (isSyntaxValid && isMxValid) {
 
          customStatus = isDisposable ? 'Risky (Temporary Email)' : 'Deliverable';
 
        }
 
        resultPayload = {
 
          valid: isOverallValid,
 
          syntaxValid: isSyntaxValid,
 
          mxValid: isMxValid,
 
          disposableValid: !isDisposable,
 
          roleValid: !isRoleBased,
 
          catchAll: false,
 
          validationCertainty: isOverallValid ? 0.9 : 0.1,
 
          customStatus,
 
          reason: isOverallValid ? 'Valid Email Address' : 'Undeliverable',
 
        };
 
      }
 
    }
 
    // ========== FULL MODE VALIDATION ==========
 
    else {
 
      const controller = new AbortController();
 
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.BACKEND_TIMEOUT);
 
      let response;
 
      try {
 
        response = await fetch(`${CONFIG.BACKEND_URL}/api/verify`, {
 
          method: 'POST',
 
          headers: { 'Content-Type': 'application/json' },
 
          body: JSON.stringify({ email: normalizedEmail }),
 
          signal: controller.signal,
 
          cache: 'no-store',
 
        });
 
      } catch (unknownError) {
 
        const fetchError = unknownError as Error;
 
        clearTimeout(timeoutId);
 
        console.error("🚨 Backend Connection Error:", {
 
          error: fetchError.message,
 
          backend: CONFIG.BACKEND_URL,
 
          email: normalizedEmail,
 
        });
 
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
 
          return NextResponse.json(
 
            {
 
              error: 'Timeout',
 
              details:
 
                'The verification server took too long to respond. ' +
 
                'The email server may be using greylisting.',
 
            },
 
            { status: 504 }
 
          );
 
        }
 
        return NextResponse.json(
 
          {
 
            error: 'Connection Error',
 
            details:
 
              'Cannot reach the verification server at this time. ' +
 
              'It may be offline or unreachable.',
 
          },
 
          { status: 502 }
 
        );
 
      }
 
      clearTimeout(timeoutId);
 
      if (!response.ok) {
 
        const text = await response.text();
 
        console.error('Backend returned error:', {
 
          status: response.status,
 
          body: text,
 
        });
 
        return NextResponse.json(
 
          {
 
            error: `Backend Error (${response.status})`,
 
            details: text,
 
          },
 
          { status: response.status }
 
        );
 
      }
 
      const rawText = await response.text();
 
      if (CONFIG.LOG_RESPONSES) {
 
        console.log('✅ Backend Response:', rawText);
 
      }
 
      let report: BackendValidationReport;
 
      try {
 
        report = JSON.parse(rawText);
 
      } catch {
 
        console.error('Failed to parse backend response:', rawText);
 
        return NextResponse.json(
 
          { error: 'Backend returned invalid JSON' },
 
          { status: 500 }
 
        );
 
      }
 
      // Extract validation data from report
 
      const isReportValid = extractValidity(report);
 
      const isCatchAll = extractCatchAll(report);
 
      const validationCertainty = extractCertainty(report);
 
      // Determine final validity (stricter checks)
 
      // Don't mark as valid if catch-all detected
 
      const finalValidity =
 
        isReportValid &&
 
        !isDisposable &&
 
        !isCatchAll &&
 
        validationCertainty >= CONFIG.CERTAINTY_THRESHOLD_VALID;
 
      // Determine custom status
 
      let customStatus = 'Undeliverable';
 
      if (isReportValid) {
 
        if (isDisposable) {
 
          customStatus = 'Risky (Temporary Email)';
 
        } else if (isCatchAll) {
 
          customStatus = 'Risky (Accept-All Domain)';
 
        } else {
 
          customStatus = 'Deliverable';
 
        }
 
      }
 
      resultPayload = {
 
        valid: finalValidity,
 
        syntaxValid: report.syntaxValid ?? isSyntaxValid,
 
        mxValid: report.mxValid ?? true,
 
        disposableValid: report.disposableValid !== undefined ? report.disposableValid : !isDisposable,
 
        roleValid: report.roleValid !== undefined ? report.roleValid : !isRoleBased,
 
        catchAll: isCatchAll,
 
        validationCertainty: validationCertainty,
 
        smtpCode: report.smtpCode,
 
        customStatus,
 
        reason:
 
          report.reason ||
 
          (isReportValid ? 'Email Delivered Successfully' : 'Email Not Found'),
 
      };
 
    }
 
    // Update user usage
 
    const updateFields: ProfileUpdatePayload = {};
 
    if (mode === 'basic') {
 
      updateFields.monthly_basic_used = currentMonthlyBasicUsed + 1;
 
    } else {
 
      updateFields.wallet_credits = Math.max(0, currentWalletCredits - 1);
 
    }
 
    const { data: updatedProfile } = await supabase
 
      .from('profiles')
 
      .update(updateFields)
 
      .eq('id', user.id)
 
      .select('wallet_credits, monthly_basic_used')
 
      .maybeSingle();
 
    // Log validation for analytics
 
    const { error: metricError } = await supabase.from('single_verifications').insert([
 
      {
 
        user_id: user.id,
 
        email: normalizedEmail,
 
        mode: mode === 'basic' ? 'basic' : 'full',
 
        is_valid: Boolean(resultPayload.valid),
 
        is_catch_all: Boolean(resultPayload.catchAll),
 
        validation_certainty: resultPayload.validationCertainty || 1.0,
 
        engine_type: mode === 'basic' ? 'BASIC' : 'FULL_DEEP_AI',
 
        created_at: new Date().toISOString(),
 
      },
 
    ]);
 
    if (metricError) {
 
      console.warn('Verification logging failed:', metricError.message);
 
      // Don't fail the request due to logging error
 
    }
 
    // Get final credits
 
    const finalWalletCredits =
 
      updatedProfile?.wallet_credits ??
 
      (mode === 'full' ? Math.max(0, currentWalletCredits - 1) : currentWalletCredits);
 
    const finalMonthlyBasicUsed =
 
      updatedProfile?.monthly_basic_used ??
 
      (mode === 'basic' ? currentMonthlyBasicUsed + 1 : currentMonthlyBasicUsed);
 
    return NextResponse.json({
 
      ...resultPayload,
 
      updatedCredits: finalWalletCredits,
 
      updatedCreditsUsed: finalMonthlyBasicUsed,
 
    });
 
  } catch (error) {
 
    let realError = 'Connection failure';
 
    if (error instanceof Error) realError = error.message;
 
    console.error('Verify-single endpoint error:', error);
 
    return NextResponse.json(
 
      {
 
        error: 'Server Error',
 
        details: process.env.NODE_ENV === 'development' ? realError : 'An error occurred',
 
      },
 
      { status: 500 }
 
    );
 
  }
 
}