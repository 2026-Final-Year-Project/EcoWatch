'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Historical incident data with resolution information
const INCIDENT_ARCHIVE = [
  { id: 1, type: 'Mining', lat: 5.82, lng: -2.12, severity: 'critical', hectares: 4.6, confidence: 94.2, detectedDate: '2024-01-18', detectedTime: '14:32', reportedDate: '2024-01-18', closedDate: '2024-01-19', status: 'Closed', resolution: 'Local authorities dispatched', daysOpen: 1 },
  { id: 2, type: 'Deforestation', lat: 5.78, lng: -2.09, severity: 'high', hectares: 2.1, confidence: 88.7, detectedDate: '2024-01-18', detectedTime: '14:00', reportedDate: '2024-01-18', closedDate: '2024-01-20', status: 'Closed', resolution: 'Site monitoring ongoing', daysOpen: 2 },
  { id: 3, type: 'Mining', lat: 5.85, lng: -2.05, severity: 'high', hectares: 1.8, confidence: 91.3, detectedDate: '2024-01-17', detectedTime: '09:15', reportedDate: '2024-01-17', closedDate: '2024-01-18', status: 'Closed', resolution: 'Investigation completed', daysOpen: 1 },
  { id: 4, type: 'Deforestation', lat: 5.75, lng: -2.15, severity: 'medium', hectares: 0.9, confidence: 76.5, detectedDate: '2024-01-16', detectedTime: '16:45', reportedDate: '2024-01-17', closedDate: '2024-01-21', status: 'Closed', resolution: 'Community engagement initiated', daysOpen: 5 },
  { id: 5, type: 'Mining', lat: 5.88, lng: -2.08, severity: 'critical', hectares: 5.2, confidence: 96.1, detectedDate: '2024-01-15', detectedTime: '11:22', reportedDate: '2024-01-15', closedDate: '2024-01-17', status: 'Closed', resolution: 'Operations halted', daysOpen: 2 },
  { id: 6, type: 'Deforestation', lat: 5.80, lng: -2.10, severity: 'high', hectares: 3.4, confidence: 89.9, detectedDate: '2024-01-14', detectedTime: '13:01', reportedDate: '2024-01-14', closedDate: '2024-01-19', status: 'Closed', resolution: 'Reforestation plan approved', daysOpen: 5 },
  { id: 7, type: 'Mining', lat: 5.79, lng: -2.11, severity: 'high', hectares: 2.3, confidence: 87.4, detectedDate: '2024-01-13', detectedTime: '10:30', reportedDate: '2024-01-13', closedDate: '2024-01-18', status: 'Closed', resolution: 'Legal proceedings initiated', daysOpen: 5 },
  { id: 8, type: 'Deforestation', lat: 5.83, lng: -2.07, severity: 'medium', hectares: 1.5, confidence: 79.2, detectedDate: '2024-01-12', detectedTime: '15:18', reportedDate: '2024-01-13', closedDate: '2024-01-16', status: 'Closed', resolution: 'Preventive measures in place', daysOpen: 4 },
  { id: 9, type: 'Mining', lat: 5.81, lng: -2.14, severity: 'high', hectares: 2.9, confidence: 85.6, detectedDate: '2024-01-11', detectedTime: '08:45', reportedDate: '2024-01-11', closedDate: '2024-01-15', status: 'Closed', resolution: 'Site cleared', daysOpen: 4 },
  { id: 10, type: 'Deforestation', lat: 5.77, lng: -2.08, severity: 'medium', hectares: 1.2, confidence: 81.3, detectedDate: '2024-01-10', detectedTime: '12:20', reportedDate: '2024-01-10', closedDate: '2024-01-14', status: 'Closed', resolution: 'Restoration started', daysOpen: 4 },
]

export default function History() {
  const [darkMode, setDarkMode] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('30d')
  const [sortBy, setSortBy] = useState('date-desc')

  // Filter and sort logic
  const filteredIncidents = useMemo(() => {
    let filtered = INCIDENT_ARCHIVE

    if (typeFilter !== 'all') {
      filtered = filtered.filter(inc => inc.type === typeFilter)
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter(inc => inc.severity === severityFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.detectedDate) - new Date(a.detectedDate)
      if (sortBy === 'date-asc') return new Date(a.detectedDate) - new Date(b.detectedDate)
      if (sortBy === 'severity') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        return order[a.severity] - order[b.severity]
      }
      if (sortBy === 'resolution-time') return a.daysOpen - b.daysOpen
      return 0
    })

    return filtered
  }, [typeFilter, severityFilter, sortBy])

  // Statistics
  const stats = useMemo(() => {
    const total = filteredIncidents.length
    const byType = {}
    let totalHectares = 0
    let totalDaysToResolve = 0
    let criticalCount = 0

    filteredIncidents.forEach(inc => {
      byType[inc.type] = (byType[inc.type] || 0) + 1
      totalHectares += inc.hectares
      totalDaysToResolve += inc.daysOpen
      if (inc.severity === 'critical') criticalCount += 1
    })

    const avgResolutionTime = total > 0 ? (totalDaysToResolve / total).toFixed(1) : 0

    return { 
      total, 
      byType, 
      totalHectares: totalHectares.toFixed(1),
      avgResolutionTime,
      criticalCount
    }
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

  // Get timeline data grouped by month
  const timelineData = useMemo(() => {
    const grouped = {}
    filteredIncidents.forEach(inc => {
      const date = new Date(inc.closedDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!grouped[monthKey]) grouped[monthKey] = []
      grouped[monthKey].push(inc)
    })
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredIncidents])

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
          <Link href="/" className={`pb-0.5 transition ${
            darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}>Live Map</Link>
          <Link href="/reports" className={`pb-0.5 transition ${
            darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}>Reports</Link>
          <a href="#" className="pb-0.5 transition font-semibold text-[#4a5e1a] border-b-2 border-[#4a5e1a]">History</a>
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
          <h1 className="text-4xl font-bold tracking-tight mb-2">Incident History</h1>
          <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
            Track resolved incidents, view resolution timelines, and analyze historical patterns
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Total Resolved</p>
            <p className="text-4xl font-bold text-[#4a5e1a]">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-2">incidents closed</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Avg Resolution Time</p>
            <p className="text-4xl font-bold text-blue-600">{stats.avgResolutionTime}</p>
            <p className="text-xs text-slate-500 mt-2">days</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Total Area Reclaimed</p>
            <p className="text-4xl font-bold text-green-600">{stats.totalHectares}</p>
            <p className="text-xs text-slate-500 mt-2">hectares</p>
          </div>

          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
          }`}>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Critical Resolved</p>
            <p className="text-4xl font-bold text-red-600">{stats.criticalCount}</p>
            <p className="text-xs text-slate-500 mt-2">incidents</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-2xl border p-6 mb-8 ${
          darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="grid grid-cols-5 gap-4">
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

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">Time Range</label>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition ${
                  darkMode 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

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
                <option value="resolution-time">Fastest Resolved</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-2">&nbsp;</label>
              <button className="w-full px-3 py-2 rounded-lg bg-[#4a5e1a] text-white text-sm font-medium hover:bg-[#3a4d12] transition">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Timeline View */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Resolution Timeline</h2>
          <div className="space-y-8">
            {timelineData.map(([monthKey, incidents]) => {
              const [year, month] = monthKey.split('-')
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              const monthName = monthNames[parseInt(month) - 1]

              return (
                <div key={monthKey}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent dark:from-white/20"></div>
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{monthName} {year}</h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-slate-300 to-transparent dark:from-white/20"></div>
                  </div>

                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className={`rounded-2xl border p-4 transition hover:shadow-md ${
                          darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                                {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                              </span>
                              <span className="font-semibold">{incident.type}</span>
                              <span className="text-sm text-slate-500">• {incident.hectares} ha</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{incident.resolution}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>Detected: {incident.detectedDate}</span>
                              <span>Reported: {incident.reportedDate}</span>
                              <span>Closed: {incident.closedDate}</span>
                              <span className="font-semibold text-[#4a5e1a]">Resolution: {incident.daysOpen} day{incident.daysOpen !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <button className="text-[#4a5e1a] hover:underline font-medium text-sm whitespace-nowrap ml-4">
                            View Details →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detailed Table */}
        <div className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'
        }`}>
          <div className="px-6 py-4 border-b border-white/10 dark:border-white/10">
            <h3 className="text-lg font-semibold">Complete Archive</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Type</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Detected</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Resolved</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Resolution Time</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Area</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Severity</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 font-medium">{incident.type}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div>{incident.detectedDate}</div>
                      <div className="text-xs text-slate-500">{incident.detectedTime}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {incident.closedDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-100/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
                        {incident.daysOpen} day{incident.daysOpen !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">{incident.hectares} ha</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                      {incident.resolution}
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
            Showing <span className="font-semibold">{filteredIncidents.length}</span> resolved incidents
          </p>
          <button className="px-4 py-2 rounded-lg bg-[#4a5e1a] text-white text-sm font-semibold hover:bg-[#3a4d12] transition">
            📥 Export History (CSV)
          </button>
        </div>

      </main>
    </div>
  )
}