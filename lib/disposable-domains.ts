// lib/disposable-domains.ts

// Using a Set provides O(1) lookup time, which is much faster than array.includes()
// Combine all your scattered domain lists into this single Set.
const DISPOSABLE_DOMAINS_SET = new Set([
  'mailinator.com', 
  '10minutemail.com', 
  'guerrillamail.com', 
  'yopmail.com', 
  'tempmail.com', 
  'burnermail.io'
  // Add any other domains you were using in your app here
]);

export function isDisposableDomain(domain: string): boolean {
  if (!domain) return false;
  
  // Sanitize the input before checking
  const cleanDomain = domain.toLowerCase().trim();
  return DISPOSABLE_DOMAINS_SET.has(cleanDomain);
}