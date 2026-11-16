/**
 * Server-side verification for Cloudflare Turnstile tokens.
 * Call this from any API route or server action that collects a Turnstile
 * token from the client, BEFORE trusting the rest of the submission.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string
): Promise<boolean> {
  if (!token) return false

  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    console.error('🚨 TURNSTILE CONFIG ERROR: TURNSTILE_SECRET_KEY is not set')
    return false
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secret)
    formData.append('response', token)
    if (remoteIp) formData.append('remoteip', remoteIp)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    return data?.success === true
  } catch (err) {
    console.error('🚨 TURNSTILE VERIFY ERROR:', err)
    return false
  }
}