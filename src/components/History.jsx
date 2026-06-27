'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Extended historical data with timestamps
const HISTORY_DATA = [
  {
    id: 1,
    type: 'Mining',
    severity: 'critical',
    hectares: 4.6,
    confidence: 94.2,
    date: '2024-01-18',
    time: '14:32',
    resolved: '2024-01-19',
    status: 'Escalated',
    coords: '5.8200° N, 2.1200° W',
    notes: 'Illegal mining operation detected and reported to authorities.',
  },
  {
    id: 2,
    type: 'Deforestation',
    severity: 'high',
    hectares: 2.1,
    confidence: 88.7,
    date: '2024-01-18',
    time: '14:00',
    resolved: '2024-01-18',
    status: 'Reported',
    coords: '5.7800° N, 2.0900° W',
    notes: 'Unauthorized forest clearing in protected area.',
  },
  {
    id: 3,
    type: 'Mining',
    severity: 'high',
    hectares: 1.8,
    confidence: 91.3,
    date: '2024-01-17',
    time: '09:15',
    resolved: '2024-01-17',
    status: 'Reported',
    coords: '5.8500° N, 2.0500° W',
    notes: 'Small-scale mining detected near river.',
  },
  {
    id: 4,
    type: 'Deforestation',
    severity: 'medium',
    hectares: 0.9,
    confidence: 76.5,
    date: '2024-01-16',
    time: '16:45',
    resolved: '2024-01-20',
    status: 'Monitoring',
    coords: '5.7500° N, 2.1500° W',
    notes: 'Low-level tree cutting, under observation.',
  },
  {
    id: 5,
    type: 'Mining',
    severity: 'critical',
    hectares: 5.2,
    confidence: 96.1,
    date: '2024-01-15',
    time: '11:22',
    resolved: '2024-01-16',
    status: 'Escalated',
    coords: '5.8800° N, 2.0800° W',
    notes: 'Major mining operation with significant environmental impact.',
  },
  {
    id: 6,
    type: 'Deforestation',
    severity: 'high',
    hectares: 3.4,
    confidence: 89.9,
    date: '2024-01-14',
    time: '13:01',
    resolved: '2024-01-15',
    status: 'Reported',
    coords: '5.8000° N, 2.1000° W',
    notes: 'Large-scale forest clearance detected.',
  },
  {
    id: 7,
    type: 'Mining',
    severity: 'high',
    hectares: 2.3,
    confidence: 87.4,
    date: '2024-01-13',
    time: '10:30',
    resolved: '2024-01-14',
    status: 'Monitoring',
    coords: '5.7900° N, 2.1100° W',
    notes: 'Active mining site with ongoing operations.',
  },
  {
    id: 8,
    type: 'Deforestation',
    severity: 'medium',
    hectares: 1.5,
    confidence: 79.2,
    date: '2024-01-12',
    time: '15:18',
    resolved: '2024-01-18',
    status: 'Monitoring',
    coords: '5.8300° N, 2.0700° W',
    notes: 'Minimal deforestation, likely agricultural clearance.',
  },
  {
    id: 9,
    type: 'Mining',
    severity: 'medium',
    hectares: 1.2,
    confidence: 82.1,
    date: '2024-01-11',
    time: '08:45',
    resolved: '2024-01-12',
    status: 'Reported',
    coords: '5.7700° N, 2.1300° W',
    notes: 'Small mining activity detected.',
  },
  {
    id: 10,
    type: 'Deforestation',
    severity: 'critical',
    hectares: 6.8,
    confidence: 95.3,
    date: '2024-01-10',
    time: '12:00',
    resolved: '2024-01-11',
    status: 'Escalated',
    coords: '5.8600° N, 2.0600° W',
    notes: 'Massive deforestation event requiring immediate intervention.',
  },
]

export default function History() {
  const [darkMode, setDarkMode] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [viewMode, setViewMode] = useState('timeline') // timeline or list

  // Filter and sort logic
  const filteredHistory = useMemo(() => {
    let filtered = HISTORY_DATA

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
      return 0
    })

    return filtered
  }, [typeFilter, severityFilter, statusFilter, sortBy])

  // Statistics
  const stats = useMemo(() => {
    const total = filteredHistory.length
    const critical = filteredHistory.filter(i => i.severity === 'critical').length
    const totalHectares = filteredHistory.reduce((sum, i) => sum + i.hectares, 0)
    
    const byType = {}
    const byStatus = {}
    filteredHistory.forEach(inc => {
      byType[inc.type] = (byType[inc.type] || 0) + 1
      byStatus[inc.status] = (byStatus[inc.status] || 0) + 1
    })

    return { total, critical, totalHectares, byType, byStatus }
  }, [filteredHistory])

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

  const getStatusIcon = (status) => {
    const icons = {
      'Escalated': '⚠️',
      'Reported': '📋',
      'Monitoring': '👁️',
    }
    return icons[status] || '•'
  }

    const downloadReport = () => {
    const link = document.createElement("a");
    link.href = "/historical-report.pdf";   // file location
    link.download = "historical-report.pdf";
    link.click();
  };

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
            Review historical detections, track patterns, and analyze environmental changes over time
          </p>
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
            <button className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
              darkMode 
                ? 'border-white/20 text-white hover:bg-white/10' 
                : 'border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
            
            >
              📊 Export Analytics
            </button >
            <button 
             onClick={() => downloadReport()}
            className="px-4 py-2 rounded-lg bg-[#4a5e1a] text-white text-sm font-semibold hover:bg-[#3a4d12] transition">
              📥 Download Historical Report
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
