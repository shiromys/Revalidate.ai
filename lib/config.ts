// lib/constants.ts

export function getBackendUrl(): string {
  const backendUrl = process.env.REVALIDATE_BACKEND_URL;

  if (!backendUrl) {
    throw new Error(
      "CRITICAL CONFIGURATION ERROR: REVALIDATE_BACKEND_URL is missing in environment variables."
    );
  }

  // TEMPORARILY DISABLED: Strict HTTPS checking.
  // We are disabling this so your http://5.78.65.28:4000 backend works properly.
  // Once you attach a domain (like api.revalidate.ai) to Hetzner via Cloudflare, you can re-enable this.
  /*
  if (!backendUrl.startsWith("https://") && process.env.NODE_ENV === "production") {
    throw new Error(
      "SECURITY ERROR: REVALIDATE_BACKEND_URL must use HTTPS protocol in production."
    );
  }
  */

  return backendUrl.replace(/\/$/, "");
}