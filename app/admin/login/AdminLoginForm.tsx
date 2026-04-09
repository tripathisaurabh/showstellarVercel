'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'

export default function AdminLoginForm({ reason }: { reason?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Invalid email or password')
      }

      window.location.assign('/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white border rounded-2xl p-8 lg:p-10 shadow-sm" style={{ border: '1px solid var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--navy)' }}>
            <Shield className="w-7 h-7 text-white" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>Admin Login</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>ShowStellar Administration</p>
          </div>

          {reason === 'not-admin' && (
            <div className="p-4 rounded-xl text-sm text-red-600 mb-4" style={{ background: 'var(--surface-2)', border: '1px solid rgba(193,117,245,0.18)' }}>
              This account is not marked as admin in the users table.
            </div>
          )}
          {reason === 'unauthenticated' && (
            <div className="p-4 rounded-xl text-sm text-amber-600 mb-4" style={{ background: 'var(--surface-2)', border: '1px solid rgba(193,117,245,0.22)' }}>
              Please sign in again.
            </div>
          )}
          {error && (
            <div className="p-4 rounded-xl text-sm text-red-600 mb-4" style={{ background: 'var(--surface-2)', border: '1px solid rgba(193,117,245,0.18)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@showstellar.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--navy)' }}
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
