export type ValidationStatus = "ok" | "valid" | "invalid" | "disposable" | "unknown";

export function isStatusValid(status: string): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase().trim();
  
  // Strict equality check instead of substring matching
  return normalized === "ok" || normalized === "valid";
}