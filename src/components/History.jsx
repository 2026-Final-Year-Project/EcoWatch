'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchJson } from '@/lib/api'
import { buildHistoryAnalyticsPdf, createHistoricalReportFilename, createHistoryAnalyticsFilename } from '@/utils/historyAnalyticsPdf'
import { useTheme } from './ThemeProvider'
import { MoonIcon, SunIcon } from './Icons'

const coordinates = (latitude, longitude) => `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`
const probability = value => `${(value * 100).toFixed(2)}%`
const area = value => `${(value / 10_000).toFixed(3)} ha`
const source = value => value === 'community-report' ? 'Community report' : 'Map analysis'

function ResultBadge({ run }) {
  return <span className={`inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-center text-xs font-semibold leading-none ${run.miningDetected ? 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200' : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'}`}>{run.miningDetected ? 'Mining signal detected' : 'No mining detected'}</span>
}

function Metric({ label, value }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>
}

function RunCard({ run, darkMode }) {
  return <article className={`rounded-2xl border p-6 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-light-surface'}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between"><div><p className="text-xs font-mono uppercase tracking-widest text-slate-400">{source(run.source)}</p><h2 className="mt-2 text-lg font-semibold">{new Date(run.analysedAt).toLocaleString()}</h2><p className="mt-1 font-mono text-sm text-slate-500">{coordinates(run.latitude, run.longitude)}</p></div><ResultBadge run={run} /></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-4"><Metric label="Average tile probability" value={probability(run.meanProbability)} /><Metric label="Affected area" value={area(run.affectedAreaM2)} /><Metric label="Largest region" value={`${run.largestComponentPixels} px`} /><Metric label="Model version" value={run.modelVersion} /></div>
    <p className="mt-5 text-xs text-slate-500">Inference window: {run.dateStart && run.dateEnd ? `${run.dateStart} to ${run.dateEnd}` : 'Latest available satellite scene'} · Detection level: {run.detectionLevel}</p>
  </article>
}

function RunTable({ runs, darkMode }) {
  return <div className={`overflow-x-auto rounded-2xl border ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-light-surface'}`}><table className="w-full text-left text-sm"><thead className="border-b border-slate-200/20 text-xs text-slate-500"><tr><th className="px-5 py-4">Analysed</th><th className="px-5 py-4">Source</th><th className="px-5 py-4">Result</th><th className="px-5 py-4">Area</th><th className="px-5 py-4">Probability</th><th className="px-5 py-4">Coordinates</th></tr></thead><tbody className="divide-y divide-slate-200/20">{runs.map(run => <tr key={run.id}><td className="px-5 py-4">{new Date(run.analysedAt).toLocaleString()}</td><td className="px-5 py-4">{source(run.source)}</td><td className="px-5 py-4"><ResultBadge run={run} /></td><td className="px-5 py-4">{area(run.affectedAreaM2)}</td><td className="px-5 py-4">{probability(run.meanProbability)}</td><td className="px-5 py-4 font-mono text-xs">{coordinates(run.latitude, run.longitude)}</td></tr>)}</tbody></table></div>
}

export default function History() {
  const { darkMode, toggleTheme } = useTheme()
  const [runs, setRuns] = useState([])
  const [resultFilter, setResultFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [timeWindow, setTimeWindow] = useState('all')
  const [windowEnd, setWindowEnd] = useState(() => Date.now())
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('timeline')
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchJson('/predictions/history')
      .then(data => { if (!cancelled) { setRuns(data.runs || []); setApiError(null) } })
      .catch(error => { if (!cancelled) setApiError(error.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filteredRuns = useMemo(() => runs.filter(run => (timeWindow === 'all' || (new Date(run.analysedAt).getTime() >= windowEnd - Number(timeWindow) * 86400000 && new Date(run.analysedAt).getTime() <= windowEnd)) && (resultFilter === 'all' || (resultFilter === 'detected' ? run.miningDetected : !run.miningDetected)) && (sourceFilter === 'all' || run.source === sourceFilter)).sort((left, right) => sortBy === 'oldest' ? new Date(left.analysedAt) - new Date(right.analysedAt) : new Date(right.analysedAt) - new Date(left.analysedAt)), [runs, resultFilter, sourceFilter, sortBy, timeWindow, windowEnd])
  const pageCount = Math.max(1, Math.ceil(filteredRuns.length / 10))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * 10
  const visibleRuns = filteredRuns.slice(pageStart, pageStart + 10)
  const stats = useMemo(() => ({ total: filteredRuns.length, detected: filteredRuns.filter(run => run.miningDetected).length, areaHectares: filteredRuns.reduce((total, run) => total + run.affectedAreaM2, 0) / 10_000, community: filteredRuns.filter(run => run.source === 'community-report').length }), [filteredRuns])
  const exportPdf = (title, filename) => { const generatedAt = new Date(); buildHistoryAnalyticsPdf(filteredRuns, generatedAt, title).save(filename(generatedAt)) }
  const panel = darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-light-surface'
  const input = darkMode ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-light-surface text-slate-900'

  return <div className={`min-h-screen font-sans ${darkMode ? 'bg-[#0f1a0a] text-white' : 'bg-light-background text-slate-900'}`}>
    <header className={`flex items-center justify-between border-b px-6 py-4 ${darkMode ? 'border-white/10 bg-[#111a09]' : 'border-black/5 bg-light-surface'}`}><Link href="/" aria-label="Go to homepage"><Image src="/Area.png" alt="EcoWatch Logo" width={90} height={40} priority /></Link><nav className="flex gap-8 text-sm"><Link href="/monitor" className="text-slate-500 hover:text-slate-800">Live Map</Link><Link href="/report" className="text-slate-500 hover:text-slate-800">Reports</Link><Link href="/history" className="border-b-2 border-[#4a5e1a] pb-0.5 font-semibold text-[#4a5e1a]">History</Link></nav><button type="button" onClick={toggleTheme} aria-label="Toggle colour theme" className="text-lg">{darkMode ? <SunIcon /> : <MoonIcon />}</button></header>
    <main className="mx-auto max-w-7xl px-6 py-10"><div className="mb-8"><p className="text-xs font-mono uppercase tracking-[0.2em] text-[#4a5e1a]">Recorded model activity</p><h1 className="mt-2 text-4xl font-bold">Analysis history</h1><p className={`mt-3 text-sm ${darkMode ? 'text-white/65' : 'text-slate-600'}`}>Every completed satellite-model analysis from the live map and community reporting flow is recorded here.</p>{apiError && <p role="alert" className="mt-3 text-sm text-red-600">{apiError}</p>}</div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Total analyses', stats.total, 'model runs'], ['Mining signals', stats.detected, 'detections in this view'], ['Affected area', stats.areaHectares.toFixed(3), 'hectares across detections'], ['Community checks', stats.community, 'report-triggered runs']].map(([label, value, caption]) => <div key={label} className={`rounded-2xl border p-5 ${panel}`}><p className="text-xs font-mono uppercase tracking-widest text-slate-400">{label}</p><p className="mt-3 text-3xl font-bold text-[#4a5e1a]">{value}</p><p className="mt-1 text-xs text-slate-500">{caption}</p></div>)}</div>
      <section className={`mb-8 rounded-2xl border p-5 ${panel}`}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end"><label className="text-xs font-mono uppercase tracking-widest text-slate-400">Time window<select value={timeWindow} onChange={event => { setTimeWindow(event.target.value); setWindowEnd(Date.now()); setPage(1) }} className={`mt-2 block w-full rounded-lg border px-3 py-2 text-sm normal-case tracking-normal ${input}`}><option value="all">All time</option><option value="1">Past 24 hours</option><option value="7">Past week (7 days)</option><option value="30">Past month (30 days)</option></select></label><label className="text-xs font-mono uppercase tracking-widest text-slate-400">Result<select value={resultFilter} onChange={event => { setResultFilter(event.target.value); setPage(1) }} className={`mt-2 block w-full rounded-lg border px-3 py-2 text-sm normal-case tracking-normal ${input}`}><option value="all">All results</option><option value="detected">Mining signal detected</option><option value="none">No mining detected</option></select></label><label className="text-xs font-mono uppercase tracking-widest text-slate-400">Source<select value={sourceFilter} onChange={event => { setSourceFilter(event.target.value); setPage(1) }} className={`mt-2 block w-full rounded-lg border px-3 py-2 text-sm normal-case tracking-normal ${input}`}><option value="all">All sources</option><option value="map">Live map</option><option value="community-report">Community report</option></select></label><label className="text-xs font-mono uppercase tracking-widest text-slate-400">Order<select value={sortBy} onChange={event => { setSortBy(event.target.value); setPage(1) }} className={`mt-2 block w-full rounded-lg border px-3 py-2 text-sm normal-case tracking-normal ${input}`}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label><div className="flex rounded-lg border border-slate-200 p-1 text-sm"><button onClick={() => setViewMode('timeline')} className={`rounded px-3 py-2 ${viewMode === 'timeline' ? 'bg-[#4a5e1a] text-white' : ''}`}>Timeline</button><button onClick={() => setViewMode('list')} className={`rounded px-3 py-2 ${viewMode === 'list' ? 'bg-[#4a5e1a] text-white' : ''}`}>List</button></div></div></section>
      {loading ? <div className={`rounded-2xl border p-8 text-sm text-slate-500 ${panel}`}>Loading recorded analyses...</div> : filteredRuns.length === 0 ? <div className={`rounded-2xl border p-8 text-center text-sm text-slate-500 ${panel}`}>No completed model analyses match these filters. Run a satellite check from the live map to start building history.</div> : viewMode === 'timeline' ? <section className="space-y-4">{visibleRuns.map(run => <RunCard key={run.id} run={run} darkMode={darkMode} />)}</section> : <RunTable runs={visibleRuns} darkMode={darkMode} />}
      {!loading && filteredRuns.length > 0 && <nav aria-label="History pagination" className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className={`text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>Showing {pageStart + 1}–{Math.min(pageStart + 10, filteredRuns.length)} of {filteredRuns.length} records</p>
        <div className="flex items-center gap-3">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className={`rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${input}`}>Previous</button>
          <span className="text-sm">Page {currentPage} of {pageCount}</span>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className={`rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${input}`}>Next</button>
        </div>
      </nav>}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Summaries and downloads include all {filteredRuns.length} records matching these filters.</p><div className="flex gap-3"><button type="button" disabled={loading} onClick={() => exportPdf('EcoWatch Model Analysis Export', createHistoryAnalyticsFilename)} className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${darkMode ? 'border-white/20' : 'border-slate-200'}`}>Export analytics</button><button type="button" disabled={loading} onClick={() => exportPdf('EcoWatch Historical Model Report', createHistoricalReportFilename)} className="rounded-lg bg-[#4a5e1a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Download historical report</button></div></div>
    </main>
  </div>
}
