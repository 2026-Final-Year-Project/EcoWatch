'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import 'leaflet/dist/leaflet.css'
import { apiUrl, fetchJson } from '@/lib/api'

export default function Monitor() {
  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerLayerRef = useRef(null)
  const userMarkerRef  = useRef(null)
  const leafletRef     = useRef(null)

  const [incidents,   setIncidents]   = useState([])
  const [selected,    setSelected]    = useState(null)
  const [darkMode,    setDarkMode]    = useState(false)
  const [locating,    setLocating]    = useState(false)
  const [locError,    setLocError]    = useState(null)
  const [userCoords,  setUserCoords]  = useState(null)
  const [mapReady,    setMapReady]    = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [apiError,    setApiError]    = useState(null)

  // Load active incidents from the Express backend for the live map.
  useEffect(() => {
    let cancelled = false

    async function loadIncidents() {
      try {
        const data = await fetchJson('/incidents/live')
        if (cancelled) return
        setIncidents(data)
        setSelected(data[0] || null)
        setApiError(null)
      } catch (error) {
        if (cancelled) return
        setApiError(error.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadIncidents()

    return () => {
      cancelled = true
    }
  }, [])

  // ── Init map ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default
      if (cancelled || !mapRef.current || mapInstanceRef.current) return

      leafletRef.current = L

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [5.8, -2.1],
        zoom: 12,
        zoomControl: false,
      })

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Esri', maxZoom: 19 }
      ).addTo(map)

      L.control.zoom({ position: 'bottomleft' }).addTo(map)

      markerLayerRef.current = L.layerGroup().addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
    })

    return () => {
      cancelled = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      markerLayerRef.current = null
      setMapReady(false)
    }
  }, [])

  // Draw incident markers whenever backend data arrives.
  useEffect(() => {
    const map = mapInstanceRef.current
    const markerLayer = markerLayerRef.current
    const L = leafletRef.current

    if (!mapReady || !map || !markerLayer || !L) return

    markerLayer.clearLayers()

    incidents.forEach((inc) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:14px;height:14px;border-radius:9999px;
          background:${inc.color};border:2px solid white;
          box-shadow:0 0 0 4px ${inc.color}44;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      L.marker([inc.lat, inc.lng], { icon })
        .addTo(markerLayer)
        .on('click', () => setSelected(inc))
    })
  }, [incidents, mapReady])

  // ── Go to current location ────────────────────────────────
  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)
    setLocError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords
        const map = mapInstanceRef.current
        const L = leafletRef.current
        if (!map || !L) return

        // Fly to user location
        map.flyTo([lat, lng], 14, { animate: true, duration: 1.5 })

        // Remove old user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.remove()
        }

        // Accuracy circle
        L.circle([lat, lng], {
          radius: accuracy,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map)

        // Blue pulsing dot
        const userIcon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:20px;height:20px;">
              <div style="
                position:absolute;inset:0;border-radius:50%;
                background:#3b82f6;opacity:0.3;
                animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
              "></div>
              <div style="
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:12px;height:12px;border-radius:50%;
                background:#3b82f6;border:2px solid white;
                box-shadow:0 0 0 3px rgba(59,130,246,0.4);
              "></div>
            </div>
            <style>
              @keyframes ping {
                0%   { transform: scale(1); opacity: 0.3; }
                75%  { transform: scale(2.5); opacity: 0; }
                100% { transform: scale(2.5); opacity: 0; }
              }
            </style>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(map)

        setUserCoords({
          lat: lat.toFixed(4),
          lng: lng.toFixed(4),
          accuracy: Math.round(accuracy),
        })
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError('Location access denied. Please allow it in your browser settings.')
            break
          case err.POSITION_UNAVAILABLE:
            setLocError('Location unavailable. Try again.')
            break
          case err.TIMEOUT:
            setLocError('Location request timed out.')
            break
          default:
            setLocError('An unknown error occurred.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const downloadSelectedReport = () => {
    if (!selected) return
    window.location.href = apiUrl(`/reports/${selected.id}/pdf`)
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
          <Link href="/monitor" className="pb-0.5 transition font-semibold text-[#4a5e1a] border-b-2 border-[#4a5e1a]">Live Map</Link>
          <Link href="/report" className={`pb-0.5 transition ${
            darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}>Reports</Link>
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
      <div className="flex h-[calc(100vh-73px)]">

        {/* MAP */}
        <div className="relative flex-1">

          {/* Legend */}
          <div className={`absolute top-4 left-4 z-1000 rounded-2xl px-5 py-4 shadow-lg text-sm backdrop-blur ${
            darkMode ? 'bg-[#1a2a10]/90 text-white' : 'bg-white/90 text-slate-700'
          }`}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3 text-slate-400">Legend</p>
            {[
              { label: 'Active Fires',  color: '#ef4444' },
              { label: 'Mining',        color: '#f97316' },
              { label: 'Deforestation', color: '#22c55e' },
              { label: 'You are here',  color: '#3b82f6' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* My Location button */}
          <div className="absolute bottom-24 left-4 z-1000 flex flex-col gap-2">
            <button
              onClick={goToMyLocation}
              disabled={locating}
              title="Go to my location"
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow transition ${
                locating
                  ? 'opacity-60 cursor-wait'
                  : 'hover:scale-105 active:scale-95'
              } ${darkMode ? 'bg-[#1a2a10] text-white' : 'bg-white text-slate-700'}`}
            >
              {locating ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                </svg>
              )}
            </button>

            <button className={`w-10 h-10 rounded-xl flex items-center justify-center shadow ${
              darkMode ? 'bg-[#1a2a10] text-white' : 'bg-white text-slate-700'
            }`}>◈</button>
          </div>

          {/* Error toast */}
          {locError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-1000 bg-red-600 text-white text-xs px-4 py-2 rounded-xl shadow-lg max-w-xs text-center">
              {locError}
              <button onClick={() => setLocError(null)} className="ml-2 underline">dismiss</button>
            </div>
          )}

          {/* User coords badge */}
          {userCoords && (
            <div className={`absolute top-4 right-4 z-1000 rounded-2xl px-4 py-3 shadow-lg text-xs backdrop-blur ${
              darkMode ? 'bg-[#1a2a10]/90 text-white' : 'bg-white/90 text-slate-700'
            }`}>
              <p className="text-[9px] font-mono uppercase tracking-widest text-blue-500 mb-1">Your location</p>
              <p className="font-mono">{userCoords.lat}° N, {userCoords.lng}°</p>
              <p className="text-slate-400 text-[10px] mt-0.5">±{userCoords.accuracy}m accuracy</p>
            </div>
          )}

          {/* API error badge */}
          {apiError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 bg-red-600 text-white text-xs px-4 py-2 rounded-xl shadow-lg max-w-xs text-center">
              {apiError}
            </div>
          )}

          <div ref={mapRef} className="w-full h-full z-0" />
        </div>

        {/* SIDEBAR */}
        <aside className={`w-85 shrink-0 flex flex-col border-l overflow-y-auto ${
          darkMode ? 'bg-[#111a09] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="p-6 flex flex-col gap-5 flex-1">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Detection Intel</h2>
                <p className="text-xs text-slate-400 mt-1">Real-time analysis from Sentinel-2B</p>
              </div>
              <button className="text-slate-400 text-lg">···</button>
            </div>

            {loading && (
              <div className={`rounded-2xl border p-5 text-sm ${
                darkMode ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-100 bg-slate-50 text-slate-500'
              }`}>
                Loading live detections...
              </div>
            )}

            {!loading && !selected && (
              <div className={`rounded-2xl border p-5 text-sm ${
                darkMode ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-100 bg-slate-50 text-slate-500'
              }`}>
                No active incidents available.
              </div>
            )}

            {selected && (
            <>
            <div className={`rounded-2xl border p-5 ${
              darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-red-100 text-red-600">
                  {selected.severity === 'critical' ? 'Critical Alert' : 'High Alert'}
                </span>
                <span className="text-xs text-slate-400">{selected.timeAgo || selected.time}</span>
              </div>
              <p className="text-lg font-bold">Illegal {selected.type} Detected</p>
              <p className="text-sm text-slate-500 mt-1">{selected.hectares} hectares affected</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100'}`}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Confidence</p>
                <p className="text-2xl font-bold text-[#4a5e1a]">{selected.confidence}%</p>
              </div>
              <div className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100'}`}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">GPS Coordinates</p>
                <p className="text-sm font-medium leading-snug">{selected.coords}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Satellite Evidence</p>
                <button className="text-xs text-[#4a5e1a] font-medium hover:underline">View Full Res</button>
              </div>
              <div className="relative rounded-2xl overflow-hidden h-44 bg-slate-200">
                <Image
                  src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/1994/1978"
                  alt="Satellite evidence"
                  width={320}
                  height={176}
                  unoptimized
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded-lg">
                  IR Spectrum Enabled
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <button className="w-full rounded-2xl bg-[#4a5e1a] text-white text-sm font-semibold py-4 hover:bg-[#3a4d12] transition">
                <Link href="/report">
                ⚡ Escalate to Local Authorities
                </Link>
              </button>
              <button
                onClick={downloadSelectedReport}
                className={`w-full rounded-2xl border text-sm font-medium py-4 transition ${
                darkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}>
                Download Incident Report (PDF)
              </button>
            </div>
            </>
            )}

            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 text-center pt-2">
              System: Online
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
