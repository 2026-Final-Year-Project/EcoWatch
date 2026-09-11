'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchJson } from '@/lib/api'
import { clearCommunitySession, getCommunitySession } from '@/lib/auth'
import { readAnalysisReportDraft, clearAnalysisReportDraft } from '@/lib/analysisReportDraft'
import { useTheme } from './ThemeProvider'
import { MoonIcon, SearchIcon, SunIcon } from './Icons'

const formatCoordinates = (latitude, longitude) => `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`

export default function Report() {
  const { darkMode, toggleTheme } = useTheme()
  const [location, setLocation] = useState(null)
  const [analysisDraft, setAnalysisDraft] = useState(null)
  const [manualLatitude, setManualLatitude] = useState('')
  const [manualLongitude, setManualLongitude] = useState('')
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [result, setResult] = useState(null)
  const [sites, setSites] = useState([])
  const [clusterRadius, setClusterRadius] = useState(250)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [signOutModalOpen, setSignOutModalOpen] = useState(false)
  const [session, setSession] = useState(null)

  const loadSites = async () => {
    try {
      const data = await fetchJson('/community-reports')
      setSites(data.sites)
      setClusterRadius(data.clusterRadiusMetres)
      setApiError(null)
    } catch (error) {
      setApiError(error.message)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      setSession(getCommunitySession())
      const draft = new URLSearchParams(window.location.search).get('from') === 'map' ? readAnalysisReportDraft() : null
      if (draft) {
        setAnalysisDraft(draft)
        setManualLatitude(String(draft.latitude))
        setManualLongitude(String(draft.longitude))
        setLocation({ latitude: draft.latitude, longitude: draft.longitude, accuracy: null, source: 'map' })
      }
      try {
        const data = await fetchJson('/community-reports')
        setSites(data.sites)
        setClusterRadius(data.clusterRadiusMetres)
      } catch (error) {
        setApiError(error.message)
      }
    }
    initialize()
  }, [])

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location services.')
      return
    }
    setGettingLocation(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setAnalysisDraft(null)
        clearAnalysisReportDraft()
        setLocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: Math.round(coords.accuracy), source: 'device' })
        setGettingLocation(false)
      },
      (error) => {
        setGettingLocation(false)
        setLocationError(error.code === error.PERMISSION_DENIED ? 'Location access was denied. Allow access and try again.' : 'Unable to obtain your current location. Try again outdoors with location services enabled.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const useManualLocation = () => {
    const latitude = Number(manualLatitude)
    const longitude = Number(manualLongitude)
    if (!manualLatitude.trim() || !manualLongitude.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setLocationError('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).')
      return
    }
    setLocation({ latitude, longitude, accuracy: null, source: 'manual' })
    if (latitude !== analysisDraft?.latitude || longitude !== analysisDraft?.longitude) {
      setAnalysisDraft(null)
      clearAnalysisReportDraft()
    }
    setLocationError(null)
  }

  const submitReport = async (event) => {
    event.preventDefault()
    if (!location || !consent || submitting) return
    const activeSession = getCommunitySession()
    if (!activeSession) {
      setAuthModalOpen(true)
      return
    }
    setSubmitting(true)
    setApiError(null)
    try {
      const data = await fetchJson('/community-reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeSession.token}` },
        body: JSON.stringify({ ...location, ...(analysisDraft ? { analysisId: analysisDraft.analysisId } : {}), notes: [analysisDraft?.summary, notes].filter(Boolean).join('\n\n') }),
      })
      setResult(data)
      clearAnalysisReportDraft()
      setAnalysisDraft(null)
      setNotes('')
      setSites((previous) => [data.site, ...previous.filter((site) => site.id !== data.site.id)])
    } catch (error) {
      setApiError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const panel = darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-light-surface'
  const mutedPanel = darkMode ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-100 bg-light-muted text-slate-600'

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0f1a0a] text-white' : 'bg-light-background text-slate-900'}`}>
      <header className={`flex items-center justify-between border-b px-6 py-4 ${darkMode ? 'border-white/10 bg-[#111a09]' : 'border-black/5 bg-light-surface'}`}>
        <Link href="/" className="flex items-center hover:opacity-80 transition" aria-label="Go to homepage">
          <Image src="/Area.png" alt="EcoWatch Logo" width={90} height={40} className="object-contain" priority />
        </Link>
        <nav className="flex gap-8 text-sm">
          <Link href="/monitor" className={darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'}>Live Map</Link>
          <Link href="/report" className="border-b-2 border-[#4a5e1a] pb-0.5 font-semibold text-[#4a5e1a]">Reports</Link>
          <Link href="/history" className={darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'}>History</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button type="button" aria-label="Search" className={darkMode ? 'text-white/60' : 'text-slate-400'}><SearchIcon /></button>
          <button type="button" onClick={toggleTheme} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className={darkMode ? 'text-white/60' : 'text-slate-400'}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 max-w-3xl">
          <p className="mb-2 text-xs font-mono uppercase tracking-[0.2em] text-[#4a5e1a]">Community observations</p>
          <h1 className="text-4xl font-bold tracking-tight">Report a possible mining site</h1>
          <p className={`mt-3 leading-relaxed ${darkMode ? 'text-white/65' : 'text-slate-600'}`}>Share a location you have personally observed. Nearby reports are grouped within {clusterRadius} m, and {analysisDraft ? 'your original map analysis is included with your report.' : 'EcoWatch runs a satellite-model check on the clustered location.'}</p>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
          <form onSubmit={submitReport} className={`rounded-3xl border p-6 shadow-sm ${panel}`}>
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2ebd2] text-[#4a5e1a]">1</span>
              <div><h2 className="font-semibold">Capture your current location</h2><p className="mt-1 text-sm text-slate-500">EcoWatch only requests location after you choose the button below.</p></div>
            </div>

            <button type="button" onClick={captureLocation} disabled={gettingLocation} className="w-full rounded-2xl bg-[#4a5e1a] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#3a4d12] disabled:cursor-wait disabled:opacity-60">
              {gettingLocation ? 'Locating you…' : location ? 'Update current location' : 'Use my current location'}
            </button>
            <div className="my-5 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-slate-200/30" />or enter coordinates<span className="h-px flex-1 bg-slate-200/30" /></div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium">Latitude
                <input type="number" step="any" value={manualLatitude} onChange={(event) => setManualLatitude(event.target.value)} placeholder="e.g. 6.4330" className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ring-[#4a5e1a] focus:ring-2 ${darkMode ? 'border-white/15 bg-white/5 text-white placeholder:text-white/35' : 'border-slate-200 bg-light-surface placeholder:text-slate-400'}`} />
              </label>
              <label className="text-xs font-medium">Longitude
                <input type="number" step="any" value={manualLongitude} onChange={(event) => setManualLongitude(event.target.value)} placeholder="e.g. -2.0380" className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ring-[#4a5e1a] focus:ring-2 ${darkMode ? 'border-white/15 bg-white/5 text-white placeholder:text-white/35' : 'border-slate-200 bg-light-surface placeholder:text-slate-400'}`} />
              </label>
            </div>
            <button type="button" onClick={useManualLocation} className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm font-medium transition ${darkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-light-muted'}`}>Use entered coordinates</button>
            {locationError && <p className="mt-3 text-sm text-red-600">{locationError}</p>}
            {location && <div className={`mt-4 rounded-2xl border p-4 ${mutedPanel}`}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Location ready</p>
              <p className="mt-1 font-mono text-sm">{formatCoordinates(location.latitude, location.longitude)}</p>
              <p className="mt-1 text-xs text-slate-500">{location.source === 'map' ? 'Selected map analysis location' : location.source === 'manual' ? 'Entered coordinates' : `Estimated device accuracy: ±${location.accuracy} m`}</p>
            </div>}

            <div className="my-7 border-t border-slate-200/20" />
            <label className="mb-2 block text-sm font-medium" htmlFor="report-notes">What did you observe? <span className="font-normal text-slate-400">Optional</span></label>
            <textarea id="report-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} rows={4} placeholder="For example: excavators, exposed soil, sediment in a nearby river…" className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none ring-[#4a5e1a] focus:ring-2 ${darkMode ? 'border-white/15 bg-white/5 text-white placeholder:text-white/35' : 'border-slate-200 bg-light-surface placeholder:text-slate-400'}`} />

            <label className={`mt-5 flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm ${mutedPanel}`}>
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#4a5e1a]" />
              <span>I confirm this is a good-faith observation. I understand that this location and report time will be stored, grouped with nearby reports, and used for environmental monitoring.</span>
            </label>

            <button type="submit" disabled={!location || !consent || submitting} className="mt-5 w-full rounded-2xl bg-[#1f3b17] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#162d10] disabled:cursor-not-allowed disabled:opacity-45">
              {submitting ? (analysisDraft ? 'Submitting report…' : 'Storing report and running satellite check…') : (analysisDraft ? 'Submit report' : 'Submit report and run satellite check')}
            </button>
            {apiError && <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">This report was not added</p>
              <p className="mt-1 leading-relaxed">{apiError}</p>
            </div>}
            {session && <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Reporting as {session.user.name}</span><button type="button" onClick={() => setSignOutModalOpen(true)} className="font-medium text-[#4a5e1a] hover:underline">Sign out</button></div>}
            <p className="mt-3 text-center text-xs text-slate-500">Do not use this tool for emergencies or to make accusations about individuals.</p>
          </form>

          <section className="space-y-5">
            {analysisDraft && <div className={`rounded-3xl border p-6 ${panel}`}>
              <h2 className="font-semibold">Analysis included with your report</h2>
              <p className={`mt-3 whitespace-pre-line text-sm leading-relaxed ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>{analysisDraft.summary}</p>
              <p className={`mt-3 text-xs ${darkMode ? 'text-white/65' : 'text-slate-600'}`}>Review the location, add observations, and confirm below to submit. Your original map analysis will be saved with this report; no new satellite check will run.</p>
            </div>}
            <div className={`rounded-3xl border p-6 ${panel}`}>
              <p className="text-xs font-mono uppercase tracking-widest text-slate-400">How corroboration works</p>
              <ol className="mt-5 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-white/70">
                <li><strong className="text-[#4a5e1a]">01.</strong> A report creates or joins a site within {clusterRadius} m.</li>
                <li><strong className="text-[#4a5e1a]">02.</strong> One account can contribute once per site. Independent account reports increase community corroboration, not model confidence.</li>
                <li><strong className="text-[#4a5e1a]">03.</strong> {analysisDraft ? 'EcoWatch reuses your saved map analysis without running the model again.' : 'EcoWatch runs its satellite segmentation model separately.'}</li>
              </ol>
            </div>

            {result && <div className={`rounded-3xl border p-6 text-slate-900 ${result.prediction?.mining_detected ? 'border-red-200 bg-red-50' : 'border-[#b9cb9d] bg-[#f3f7eb]'}`}>
              <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Report stored</p>
              <h2 className="mt-2 text-lg font-semibold">{result.isNewSite ? 'New community site created' : 'Your report was added to an existing nearby site'}</h2>
              <p className="mt-2 text-sm text-slate-600">{result.site.reportCount} report{result.site.reportCount === 1 ? '' : 's'} · community corroboration {result.site.communityCorroboration}%</p>
              {result.prediction ? <p className="mt-3 text-sm font-medium">Model result: {result.prediction.mining_detected ? 'Mining signal detected' : 'No mining detected in the selected scene'}</p> : <p className="mt-3 text-sm text-slate-600">Report saved. Satellite check unavailable: {result.predictionError}</p>}
            </div>}
          </section>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold">Recent community sites</h2><p className="mt-1 text-sm text-slate-500">Grouped locations, newest report first.</p></div><span className="rounded-full bg-[#e2ebd2] px-3 py-1 text-xs font-semibold text-[#4a5e1a]">{sites.length} site{sites.length === 1 ? '' : 's'}</span></div>
          <div className={`overflow-hidden rounded-3xl border ${panel}`}>
            {sites.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No community reports yet. The first good-faith report will create a site.</p> : <ul className="divide-y divide-slate-200/10">
              {sites.slice(0, 12).map((site) => <li key={site.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-mono text-sm">{formatCoordinates(site.latitude, site.longitude)}</p><p className="mt-1 text-xs text-slate-500">Last report: {new Date(site.lastReportedAt).toLocaleString()}</p></div>
                <div className="flex items-center gap-3"><span className="rounded-full bg-[#e2ebd2] px-3 py-1 text-xs font-semibold text-[#4a5e1a]">{site.reportCount} report{site.reportCount === 1 ? '' : 's'}</span><span className="text-xs text-slate-500">Corroboration {site.communityCorroboration}%</span>{site.latestPrediction && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${site.latestPrediction.mining_detected ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{site.latestPrediction.mining_detected ? 'Model signal' : 'No model signal'}</span>}</div>
              </li>)}
            </ul>}
          </div>
        </section>
      </main>
      {authModalOpen && <div role="dialog" aria-modal="true" aria-labelledby="account-required-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-5" onMouseDown={() => setAuthModalOpen(false)}>
        <div className="w-full max-w-md rounded-3xl bg-light-surface p-7 text-slate-900 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#4a5e1a]">Account required</p>
          <h2 id="account-required-title" className="mt-2 text-2xl font-bold">Create an account to submit a report</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">EcoWatch keeps the map and satellite checks open to everyone. We ask for an account only when submitting a community report, so one person cannot repeatedly increase a site’s corroboration.</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">Your account is used to limit one contribution per nearby site; it does not make your name public on the map.</p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setAuthModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium">Not now</button><Link href={analysisDraft ? "/auth?from=map" : "/auth"} className="rounded-xl bg-[#1f3b17] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#162d10]">Continue to sign in</Link></div>
        </div>
      </div>}
      {signOutModalOpen && <div role="dialog" aria-modal="true" aria-labelledby="sign-out-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-5" onMouseDown={() => setSignOutModalOpen(false)}>
        <div className="w-full max-w-md rounded-3xl bg-light-surface p-7 text-slate-900 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#4a5e1a]">Confirm sign out</p>
          <h2 id="sign-out-title" className="mt-2 text-2xl font-bold">Sign out of EcoWatch?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">You will need to sign in again before you can submit another community report. The reports you have already submitted will remain stored.</p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSignOutModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium">Stay signed in</button><button type="button" onClick={async () => { try { await clearCommunitySession(); setSession(null); setSignOutModalOpen(false) } catch (error) { setApiError(error.message) } }} className="rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800">Sign out</button></div>
        </div>
      </div>}
    </div>
  )
}
