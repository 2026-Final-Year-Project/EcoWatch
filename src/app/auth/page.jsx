'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchJson } from '@/lib/api'
import { saveCommunitySession } from '@/lib/auth'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const data = await fetchJson(mode === 'signup' ? '/auth/register' : '/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signup' ? { name, email, password } : { email, password }),
      })
      saveCommunitySession(data)
      router.replace('/report')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-[#4a5e1a] focus:ring-2'
  const passwordInputType = passwordVisible ? 'text' : 'password'

  return <main className="flex min-h-screen items-center justify-center bg-[#f6f7f1] px-6 py-12 text-slate-900">
    <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-slate-900/5">
      <Link href="/report" className="text-sm font-medium text-[#4a5e1a] hover:underline">← Back to reports</Link>
      <p className="mt-7 text-xs font-mono uppercase tracking-[0.2em] text-[#4a5e1a]">Community reporting</p>
      <h1 className="mt-2 text-3xl font-bold">{mode === 'signup' ? 'Create your account' : 'Sign in'}</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">An account lets EcoWatch count one contribution per person at a site, helping protect community reports from repeat submissions.</p>

      <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
        <button type="button" onClick={() => { setMode('signup'); setError(null) }} className={`rounded-lg py-2 ${mode === 'signup' ? 'bg-white text-[#1f3b17] shadow-sm' : 'text-slate-500'}`}>Create account</button>
        <button type="button" onClick={() => { setMode('signin'); setError(null) }} className={`rounded-lg py-2 ${mode === 'signin' ? 'bg-white text-[#1f3b17] shadow-sm' : 'text-slate-500'}`}>Sign in</button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        {mode === 'signup' && <label className="block text-sm font-medium">Name<input required value={name} maxLength={80} onChange={(event) => setName(event.target.value)} className={inputClass} autoComplete="name" /></label>}
        <label className="block text-sm font-medium">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} autoComplete="email" /></label>
        <label className="block text-sm font-medium">Password
          <div className="relative">
            <input required type={passwordInputType} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-16`} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#4a5e1a] hover:underline">{passwordVisible ? 'Hide' : 'Show'}</button>
          </div>
          {mode === 'signup' && <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 8 characters.</span>}
        </label>
        {mode === 'signup' && <label className="block text-sm font-medium">Confirm password
          <div className="relative">
            <input required type={passwordInputType} minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={`${inputClass} pr-16`} autoComplete="new-password" />
            <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#4a5e1a] hover:underline">{passwordVisible ? 'Hide' : 'Show'}</button>
          </div>
        </label>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={submitting} className="w-full rounded-xl bg-[#1f3b17] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#162d10] disabled:opacity-60">{submitting ? 'Please wait…' : mode === 'signup' ? 'Create account and continue' : 'Sign in and continue'}</button>
      </form>
    </section>
  </main>
}
