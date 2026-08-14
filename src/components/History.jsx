'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchJson } from '@/lib/api'
import { buildHistoryAnalyticsPdf, createHistoricalReportFilename, createHistoryAnalyticsFilename } from '@/utils/historyAnalyticsPdf'
import { useTheme } from './ThemeProvider'
import { MoonIcon, SearchIcon, SunIcon } from './Icons'

const formatCoordinates = (latitude, longitude) => `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`
const formatProbability = value => `${(value * 100).toFixed(2)}%`
const formatArea = value => `${(value / 10_000).toFixed(3)} ha`
const sourceLabel = source => source === 'community-report' ? 'Community report' : 'Map analysis'

export default function History() {
  const { darkMode, toggleTheme } = useTheme()
  const [runs, setRuns] = useState([])
  const [resultFilter, setResultFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
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

  const filteredRuns = useMemo(() => {
    const filtered = runs.filter(run => (
      (resultFilter === 'all' || (resultFilter === 'detected' ? run.miningDetected : !run.miningDetected))
      && (sourceFilter === 'all' || run.source === sourceFilter)
    ))
    filtered.sort((left, right) => sortBy === 'oldest'
      ? new Date(left.analysedAt) - new Date(right.analysedAt)
      : new Date(right.analysedAt) - new Date(left.analysedAt))
    return filtered
  }, [runs, resultFilter, sourceFilter, sortBy])

  const stats = useMemo(() => ({
    total: filteredRuns.length,
    detected: filteredRuns.filter(run => run.miningDetected).length,
    areaHectares: filteredRuns.reduce((total, run) => total + run.affectedAreaM2, 0) / 10_000,
    community: filteredRuns.filter(run => run.source === 'community-report').length,
  }), [filteredRuns])

  const exportPdf = (title, filename) => {
    const generatedAt = new Date()
    buildHistoryAnalyticsPdf(filteredRuns, generatedAt, title).save(filename(generatedAt))
  }
  const panel = darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'
  const input = darkMode ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-900'

  const downloadReport = () => {
    const generatedAt = new Date()
    const pdf = buildHistoryAnalyticsPdf(
      filteredHistory,
      generatedAt,
      'EcoWatch Historical Incident Report'
    )
    pdf.save(createHistoricalReportFilename(generatedAt))
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0f1a0a] text-white' : 'bg-[#f6f7f1] text-slate-900'
    }`}>

      {/* NAVBAR */}
      <header className={`flex items-center justify-between px-6 py-4 border-b ${
        darkMode ? 'border-white/10 bg-[#111a09]' : 'border-black/5 bg-white'
      }`}>
        <Link href="/" className="flex items-center hover:opacity-80 transition" aria-label="Go to homepage">
          <Image src="/Area.png" alt="EcoWatch Logo" width={90} height={40} className="object-contain" priority />
        </Link>

        <nav className="flex gap-8 text-sm">
          <Link href="/monitor" className={`pb-0.5 transition ${
            darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}>Live Map</Link>
          <Link href="/report" className={`pb-0.5 transition ${
            darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}>Reports</Link>
          <Link href="/history" className="pb-0.5 transition font-semibold text-[#4a5e1a] border-b-2 border-[#4a5e1a]">History</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button type="button" aria-label="Search" className={darkMode ? 'text-white/60' : 'text-slate-400'}><SearchIcon /></button>
          <button type="button" onClick={toggleTheme} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className={darkMode ? 'text-white/60' : 'text-slate-400'}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className={`px-8 py-8 max-w-7xl mx-auto`}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Incident History</h1>
          <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
            Review historical detections, track patterns, and analyze environmental changes over time
          </p>
          {apiError && (
            <p className="mt-3 text-sm text-red-600">{apiError}</p>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Total Incidents</p>
            <p className="text-4xl font-bold text-[#4a5e1a]">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-2">in history</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Critical Events</p>
            <p className="text-4xl font-bold text-red-600">{stats.critical}</p>
            <p className="text-xs text-slate-500 mt-2">high severity</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Total Area Affected</p>
            <p className="text-4xl font-bold text-orange-600">{stats.totalHectares.toFixed(1)}</p>
            <p className="text-xs text-slate-500 mt-2">hectares</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Avg Response</p>
            <p className="text-4xl font-bold text-[#4a5e1a]">1.2d</p>
            <p className="text-xs text-slate-500 mt-2">days to resolve</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className={`rounded-2xl border p-6 mb-8 ${
          darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-end gap-4 mb-4">
            <div className="flex-1 grid grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">Type</label>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="Mining">Mining</option>
                  <option value="Deforestation">Deforestation</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">Severity</label>
                <select 
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="all">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Reported">Reported</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">Sort By</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="severity">Most Severe</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 border rounded-lg p-1" style={{
              backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }}>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  viewMode === 'timeline'
                    ? 'bg-[#4a5e1a] text-white'
                    : darkMode ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 Timeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-[#4a5e1a] text-white'
                    : darkMode ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="space-y-6 mb-8">
            {loading && (
              <div className={`rounded-2xl border p-6 text-sm ${
                darkMode ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-100 bg-white text-slate-500'
              }`}>
                Loading history from API...
              </div>
            )}
            {!loading && filteredHistory.length === 0 && (
              <div className={`rounded-2xl border p-6 text-sm ${
                darkMode ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-100 bg-white text-slate-500'
              }`}>
                No historical incidents match the selected filters.
              </div>
            )}
            {filteredHistory.map((incident, idx) => (
              <div key={incident.id} className={`rounded-2xl border p-6 ${
                darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'
              }`}>
                <div className="flex gap-6">
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                      incident.severity === 'critical' ? 'bg-red-600' :
                      incident.severity === 'high' ? 'bg-orange-600' :
                      'bg-yellow-600'
                    }`} />
                    {idx !== filteredHistory.length - 1 && (
                      <div className={`w-1 h-12 mt-2 ${
                        darkMode ? 'bg-white/10' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getStatusIcon(incident.status)}</span>
                          <h3 className="text-lg font-semibold">{incident.type} - {incident.severity.toUpperCase()}</h3>
                        </div>
                        <p className="text-sm text-slate-500">{incident.date} at {incident.time}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{incident.notes}</p>

                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Area Affected</p>
                        <p className="font-semibold">{incident.hectares} ha</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Confidence</p>
                        <p className="font-semibold text-green-600">{incident.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Resolution Time</p>
                        <p className="font-semibold">{incident.resolved}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 font-mono">{incident.coords}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className={`rounded-2xl border overflow-hidden mb-8 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Detection Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Type</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Severity</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Area (ha)</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Confidence</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Resolved</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Loading history from API...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No historical incidents match the selected filters.
                      </td>
                    </tr>
                  )}
                  {filteredHistory.map((incident) => (
                    <tr key={incident.id} className={`hover:bg-white/5 transition ${
                      darkMode ? 'border-white/5' : 'border-slate-100'
                    }`}>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{incident.date}</div>
                        <div className="text-xs text-slate-500">{incident.time}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {incident.type}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {incident.hectares}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-100/20 text-green-700 dark:text-green-400 text-xs font-medium">
                          {incident.confidence}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {incident.resolved}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="flex items-center justify-between">
          <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
            Showing <span className="font-semibold">{filteredHistory.length}</span> incidents from history
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={exportAnalytics}
              disabled={loading}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              darkMode 
                ? 'border-white/20 text-white hover:bg-white/10' 
                : 'border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
            >
              📊 Export Analytics
            </button>
            <button
              type="button"
              onClick={downloadReport}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#4a5e1a] text-white text-sm font-semibold hover:bg-[#3a4d12] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              📥 Download Historical Report
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}

function ResultBadge({ run }) { return <span className={`inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-center text-xs font-semibold leading-none ${run.miningDetected ? 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200' : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'}`}>{run.miningDetected ? 'Mining signal detected' : 'No mining detected'}</span> }
function RunCard({ run, darkMode }) { return <article className={`rounded-2xl border p-6 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'}`}><div className="flex flex-col gap-4 sm:flex-row sm:justify-between"><div><p className="text-xs font-mono uppercase tracking-widest text-slate-400">{sourceLabel(run.source)}</p><h2 className="mt-2 text-lg font-semibold">{new Date(run.analysedAt).toLocaleString()}</h2><p className="mt-1 font-mono text-sm text-slate-500">{formatCoordinates(run.latitude, run.longitude)}</p></div><ResultBadge run={run} /></div><div className="mt-5 grid gap-4 sm:grid-cols-4"><Metric label="Average tile probability" value={formatProbability(run.meanProbability)} /><Metric label="Affected area" value={formatArea(run.affectedAreaM2)} /><Metric label="Largest region" value={`${run.largestComponentPixels} px`} /><Metric label="Model version" value={run.modelVersion} /></div><p className="mt-5 text-xs text-slate-500">Inference window: {run.dateStart && run.dateEnd ? `${run.dateStart} to ${run.dateEnd}` : 'Latest available satellite scene'} · Detection level: {run.detectionLevel}</p></article> }
function Metric({ label, value }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div> }
function RunTable({ runs, darkMode }) { return <div className={`overflow-x-auto rounded-2xl border ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'}`}><table className="w-full text-left text-sm"><thead className="border-b border-slate-200/20 text-xs text-slate-500"><tr><th className="px-5 py-4">Analysed</th><th className="px-5 py-4">Source</th><th className="px-5 py-4">Result</th><th className="px-5 py-4">Area</th><th className="px-5 py-4">Probability</th><th className="px-5 py-4">Coordinates</th></tr></thead><tbody className="divide-y divide-slate-200/20">{runs.map(run => <tr key={run.id}><td className="px-5 py-4">{new Date(run.analysedAt).toLocaleString()}</td><td className="px-5 py-4">{sourceLabel(run.source)}</td><td className="px-5 py-4"><ResultBadge run={run} /></td><td className="px-5 py-4">{formatArea(run.affectedAreaM2)}</td><td className="px-5 py-4">{formatProbability(run.meanProbability)}</td><td className="px-5 py-4 font-mono text-xs">{formatCoordinates(run.latitude, run.longitude)}</td></tr>)}</tbody></table></div> }
