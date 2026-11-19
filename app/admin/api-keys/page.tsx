import React from 'react'
import { listApiKeys } from '@/lib/nexus/apiKeys'
import ApiKeysManager from './components/ApiKeysManager'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const keys = await listApiKeys()

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Nexus API Keys</h1>
        <p className="text-zinc-500 font-medium mt-1">
          Scoped keys for the Application Nexus Support API (/api/support/v1). Keys are
          limited to tickets, messages and basic user info — never billing, plans,
          passwords or payment details.
        </p>
      </div>

      <ApiKeysManager keys={keys} />
    </div>
  )
}