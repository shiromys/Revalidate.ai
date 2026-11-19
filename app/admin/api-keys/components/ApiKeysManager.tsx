'use client'

import React, { useState } from 'react'
import { createNexusApiKey, revokeNexusApiKey, rotateNexusApiKey } from '../actions'
import { SUPPORT_API_SCOPES, DEFAULT_SUPPORT_SCOPES } from '@/lib/nexus/scopes'
import { Copy, Check, KeyRound, RotateCw, Ban, ShieldAlert } from 'lucide-react'
import type { NexusApiKeyRow } from '@/lib/nexus/apiKeys'

function RevealedKeyModal({ rawKey, onClose }: { rawKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-600">
          <ShieldAlert size={20} />
          <h3 className="font-black text-lg text-zinc-900">Copy this key now</h3>
        </div>
        <p className="text-sm text-zinc-500 font-medium">
          This is the only time the full key is shown. Store it in a password manager or
          secrets tool and hand it to the Nexus team that way — never by email or chat.
        </p>
        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
          <code className="text-sm font-mono text-zinc-900 break-all flex-1">{rawKey}</code>
          <button
            onClick={handleCopy}
            className="shrink-0 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 rounded-xl"
        >
          I&apos;ve saved it — close
        </button>
      </div>
    </div>
  )
}

export default function ApiKeysManager({ keys }: { keys: NexusApiKeyRow[] }) {
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [environment, setEnvironment] = useState<'staging' | 'production'>('staging')
  const [scopes, setScopes] = useState<string[]>(DEFAULT_SUPPORT_SCOPES)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleScope = (scope: string) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]))
  }

  const handleCreate = async () => {
    setBusy(true)
    setError(null)
    const formData = new FormData()
    formData.set('environment', environment)
    scopes.forEach((s) => formData.append('scopes', s))

    const result = await createNexusApiKey(formData)
    setBusy(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setRevealedKey(result.rawKey)
  }

  return (
    <div className="space-y-8">
      {revealedKey && <RevealedKeyModal rawKey={revealedKey} onClose={() => setRevealedKey(null)} />}

      {/* CREATE */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
        <h2 className="font-black text-lg text-zinc-900 flex items-center gap-2">
          <KeyRound size={18} /> Issue a new key
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Environment</label>
            <div className="flex gap-2 mt-2">
              {(['staging', 'production'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setEnvironment(env)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border ${
                    environment === env
                      ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {env === 'staging' ? 'Staging' : 'Production'}
                </button>
              ))}
            </div>
            {environment === 'production' && (
              <p className="text-xs text-amber-600 font-bold mt-2">
                Per the integration spec: don&apos;t share a production key until the staging
                version has passed testing.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-zinc-400">Scopes</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SUPPORT_API_SCOPES.map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => toggleScope(scope)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    scopes.includes(scope)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm font-bold text-red-600">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={busy}
          className="bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl"
        >
          {busy ? 'Generating…' : 'Generate key'}
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-500 text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3">Key</th>
              <th className="text-left px-6 py-3">Environment</th>
              <th className="text-left px-6 py-3">Scopes</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Last used</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-400 font-medium">
                  No keys issued yet.
                </td>
              </tr>
            )}
            {keys.map((key) => (
              <KeyRow key={key.id} apiKey={key} onRevealKey={setRevealedKey} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KeyRow({
  apiKey,
  onRevealKey,
}: {
  apiKey: NexusApiKeyRow
  onRevealKey: (rawKey: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const isRevoked = Boolean(apiKey.revoked_at)

  const handleRevoke = async () => {
    if (!window.confirm('Revoke this key immediately?')) return
    setBusy(true)
    const formData = new FormData()
    formData.set('keyId', apiKey.id)
    await revokeNexusApiKey(formData)
    setBusy(false)
  }

  const handleRotate = async () => {
    if (!window.confirm('Rotate this key? The old key is revoked immediately and a new one is issued with the same scopes.')) return
    setBusy(true)
    const formData = new FormData()
    formData.set('keyId', apiKey.id)
    const result = await rotateNexusApiKey(formData)
    setBusy(false)
    if (result.success) onRevealKey(result.rawKey)
  }

  return (
    <tr className="border-t border-zinc-100">
      <td className="px-6 py-4 font-mono text-xs text-zinc-700">{apiKey.key_prefix}</td>
      <td className="px-6 py-4">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            apiKey.environment === 'production' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
          }`}
        >
          {apiKey.environment}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-zinc-500 font-medium">{apiKey.scopes.join(', ')}</td>
      <td className="px-6 py-4">
        {isRevoked ? (
          <span className="text-xs font-black text-zinc-400 uppercase">Revoked</span>
        ) : (
          <span className="text-xs font-black text-emerald-600 uppercase">Active</span>
        )}
      </td>
      <td className="px-6 py-4 text-xs text-zinc-500">
        {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleString() : 'Never'}
      </td>
      <td className="px-6 py-4 text-right">
        {!isRevoked && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleRotate}
              disabled={busy}
              title="Rotate"
              className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 disabled:opacity-50"
            >
              <RotateCw size={14} />
            </button>
            <button
              onClick={handleRevoke}
              disabled={busy}
              title="Revoke"
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50"
            >
              <Ban size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}