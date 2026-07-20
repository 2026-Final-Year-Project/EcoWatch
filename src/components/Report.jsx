'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { apiUrl, fetchJson } from '@/lib/api'

export default function Reports() {
  const [incidents, setIncidents] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [dateRange, setDateRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  // Load report incidents from the Express backend.
  useEffect(() => {
    let cancelled = false

    async function loadReports() {
      try {
        const data = await fetchJson('/incidents')
        if (cancelled) return
        setIncidents(data)
        setApiError(null)
      } catch (error) {
        if (cancelled) return
        setApiError(error.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReports()

    return () => {
      cancelled = true
    }
  }, [])

  // Filter and sort logic
  const filteredIncidents = useMemo(() => {
    let filtered = [...incidents]

    if (typeFilter !== 'all') {
      filtered = filtered.filter(inc => inc.type === typeFilter)
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter(inc => inc.severity === severityFilter)
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inc => inc.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
      if (sortBy === 'date-asc') return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
      if (sortBy === 'severity') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        return order[a.severity] - order[b.severity]
      }
      if (sortBy === 'confidence') return b.confidence - a.confidence
      return 0
    })

    return filtered
  }, [incidents, typeFilter, severityFilter, statusFilter, sortBy])

  // Statistics
  const stats = useMemo(() => {
    const total = filteredIncidents.length
    const critical = filteredIncidents.filter(i => i.severity === 'critical').length
    const totalHectares = filteredIncidents.reduce((sum, i) => sum + i.hectares, 0)
    const avgConfidence = total
      ? (filteredIncidents.reduce((sum, i) => sum + i.confidence, 0) / total).toFixed(1)
      : '0.0'
    
    const byType = {}
    filteredIncidents.forEach(inc => {
      byType[inc.type] = (byType[inc.type] || 0) + 1
    })

    return { total, critical, totalHectares, avgConfidence, byType }
  }, [filteredIncidents])

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    }
    return colors[severity] || colors.low
  }

  const getStatusColor = (status) => {
    const colors = {
      'Escalated': 'bg-red-50 text-red-600',
      'Reported': 'bg-blue-50 text-blue-600',
      'Monitoring': 'bg-amber-50 text-amber-600',
    }
    return colors[status] || 'bg-slate-50 text-slate-600'
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
          <Link href="/report" className="pb-0.5 transition font-semibold text-[#4a5e1a] border-b-2 border-[#4a5e1a]">Reports</Link>
          <Link href="/history" className={`pb-0.5 transition ${
            darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}>History</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className={`text-lg ${darkMode ? 'text-white/60' : 'text-slate-400'}`}>🔍</button>
          <button onClick={() => setDarkMode(!darkMode)} className={`text-lg ${darkMode ? 'text-white/60' : 'text-slate-400'}`}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className={`px-8 py-8 max-w-7xl mx-auto`}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Incident Reports</h1>
          <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
            Analyze detections, generate reports, and track response status across your region
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
            <p className="text-xs text-slate-500 mt-2">in selected period</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Critical Alerts</p>
            <p className="text-4xl font-bold text-red-600">{stats.critical}</p>
            <p className="text-xs text-slate-500 mt-2">require immediate action</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Area Affected</p>
            <p className="text-4xl font-bold text-orange-600">{stats.totalHectares.toFixed(1)}</p>
            <p className="text-xs text-slate-500 mt-2">hectares</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Avg Confidence</p>
            <p className="text-4xl font-bold text-[#4a5e1a]">{stats.avgConfidence}%</p>
            <p className="text-xs text-slate-500 mt-2">detection accuracy</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className={`rounded-2xl border p-6 mb-8 ${
          darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="grid grid-cols-5 gap-4">
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
                <option value="confidence">Confidence</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">Period</label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition ${
                  darkMode 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Date & Time</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Type</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Location</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Area</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Confidence</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Severity</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      Loading incidents from API...
                    </td>
                  </tr>
                )}
                {!loading && filteredIncidents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      No incidents match the selected filters.
                    </td>
                  </tr>
                )}
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className={`hover:bg-white/5 transition ${
                    darkMode ? 'border-white/5' : 'border-slate-100'
                  }`}>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <div className="font-medium">{incident.date}</div>
                      <div className="text-xs text-slate-500">{incident.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{incident.type}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {incident.coords}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {incident.hectares} ha
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-100/20 text-green-700 dark:text-green-400 text-xs font-medium">
                        {incident.confidence}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/incidents/${incident.id}`} className="text-[#4a5e1a] hover:underline font-medium text-sm">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mt-6">
          <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
            Showing <span className="font-semibold">{filteredIncidents.length}</span> incidents
          </p>
          <div className="flex gap-3">
            <button className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
              darkMode 
                ? 'border-white/20 text-white hover:bg-white/10' 
                : 'border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}>
              📥 Export CSV
            </button>
           <a
                href={apiUrl('/reports/latest/pdf')}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-[#4a5e1a] text-white text-sm font-semibold hover:bg-[#3a4d12] transition"
              >
              📄 Generate Report (PDF)
            </a>
          </div>
        </div>

      </main>
    </div>
  )
}
