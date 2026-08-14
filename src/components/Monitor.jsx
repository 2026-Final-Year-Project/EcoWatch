'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import 'leaflet/dist/leaflet.css'
import { apiUrl, fetchJson } from '@/lib/api'
import { useTheme } from './ThemeProvider'
import { MoonIcon, SearchIcon, SunIcon } from './Icons'

export default function Monitor() {
  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const demoSiteLayerRef = useRef(null)
  const userMarkerRef  = useRef(null)
  const leafletRef     = useRef(null)
  const comparisonRequestRef = useRef(0)

  const { darkMode, toggleTheme } = useTheme()
  const [locating,    setLocating]    = useState(false)
  const [locError,    setLocError]    = useState(null)
  const [userCoords,  setUserCoords]  = useState(null)
  const [apiError,    setApiError]    = useState(null)
  const [prediction,  setPrediction]  = useState(null)
  const [predicting,  setPredicting]  = useState(false)
  const [comparison, setComparison] = useState(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState(null)
  const [fullPreview, setFullPreview] = useState(null)

  useEffect(() => {
    if (!fullPreview) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setFullPreview(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [fullPreview])

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
        center: [6.1, -1.8],
        zoom: 7.5,
        zoomControl: false,
      })

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Esri', maxZoom: 19 }
      ).addTo(map)

      L.control.zoom({ position: 'bottomleft' }).addTo(map)

      demoSiteLayerRef.current = L.layerGroup().addTo(map)

      const loadComparison = async (latlng, requestId) => {
        setComparisonLoading(true)
        setComparisonError(null)
        try {
          const [before, current] = await Promise.all([
            fetchJson('/predictions/imagery/coordinate', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude: latlng.lat, longitude: latlng.lng, date_start: '2016-01-01', date_end: '2017-01-01' }),
            }),
            fetchJson('/predictions/imagery/coordinate', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude: latlng.lat, longitude: latlng.lng }),
            }),
          ])
          if (comparisonRequestRef.current === requestId && !cancelled) setComparison({ before, current })
        } catch (error) {
          if (comparisonRequestRef.current === requestId && !cancelled) setComparisonError(error.message)
        } finally {
          if (comparisonRequestRef.current === requestId && !cancelled) setComparisonLoading(false)
        }
      }

      const analyseLocation = async (latlng, dateRange = {}) => {
        const requestId = ++comparisonRequestRef.current
        setPredicting(true)
        setPrediction(null)
        setComparison(null)
        setComparisonError(null)
        try {
          const result = await fetchJson('/predictions/coordinate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: latlng.lat, longitude: latlng.lng, ...dateRange }),
          })
          if (!cancelled) {
            const delta = 0.006
            const bbox = [latlng.lng - delta, latlng.lat - delta, latlng.lng + delta, latlng.lat + delta].join(',')
            const previewUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=640,360&format=png&f=image`
            setPrediction({ ...result, previewUrl })
            void loadComparison(latlng, requestId)
          }
        } catch (error) {
          if (!cancelled) setApiError(error.message)
        } finally {
          if (!cancelled) setPredicting(false)
        }
      }

      map.on('click', ({ latlng }) => analyseLocation(latlng))

      fetch('/demo-sites.geojson')
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('Verified sites could not be loaded.')))
        .then((collection) => {
          if (cancelled) return
          const verifiedSites = collection.features || []
          verifiedSites.forEach((feature) => {
            const [longitude, latitude] = feature.geometry?.coordinates ?? []
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
            const properties = feature.properties ?? {}
            const color = properties.color || '#dc2626'
            const yearFromImage = String(properties.image_file || '').match(/_(20\d{2})\.tif$/)?.[1]
            const year = Number(properties.year || yearFromImage)
            const dateRange = properties.date_start && properties.date_end
              ? { date_start: properties.date_start, date_end: properties.date_end }
              : Number.isInteger(year)
              ? { date_start: `${year}-01-01`, date_end: `${year + 1}-01-01` }
              : {}
            const icon = L.divIcon({
              className: '',
              html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 0 0 5px ${color}55;"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })
            const markerLabel = properties.name || 'Mining reference candidate'
            L.marker([latitude, longitude], { icon, title: markerLabel })
              .bindTooltip(markerLabel, { direction: 'top', offset: [0, -10] })
              .on('click', (event) => {
                if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent)
                analyseLocation(event.latlng, dateRange)
              })
              .addTo(demoSiteLayerRef.current)
          })
        })
        .catch((error) => {
          if (!cancelled) console.warn(error.message)
        })

      mapInstanceRef.current = map
    })

    return () => {
      cancelled = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      demoSiteLayerRef.current = null
    }
  }, [])

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

  const downloadPrediction = () => {
    if (!prediction) return
    const file = new Blob([JSON.stringify(prediction, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `ecowatch-analysis-${prediction.latitude.toFixed(5)}-${prediction.longitude.toFixed(5)}.json`
    link.click()
    URL.revokeObjectURL(url)
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
          <button type="button" aria-label="Search" className={darkMode ? 'text-white/60' : 'text-slate-400'}><SearchIcon /></button>
          <button type="button" onClick={toggleTheme} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className={darkMode ? 'text-white/60' : 'text-slate-400'}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
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
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-[#dbe7c9] border-t-[#4a5e1a] animate-spin" />
            <h2 className="text-xl font-semibold">Analysing location</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">Fetching Sentinel-2 imagery and running the illegal-mining segmentation model. This can take a moment.</p>
          </div>

          {/* Legend */}
          <div className={`absolute top-4 left-4 z-1000 rounded-2xl px-5 py-4 shadow-lg text-sm backdrop-blur ${
            darkMode ? 'bg-[#1a2a10]/90 text-white' : 'bg-white/90 text-slate-700'
          }`}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3 text-slate-400">Legend</p>
            {[
              { label: 'Validated demo site', color: '#dc2626' },
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

        {fullPreview && (
          <div onClick={() => setFullPreview(null)} className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={fullPreview.title}>
            {(() => {
              const images = fullPreview.images || [{ url: fullPreview.url, title: fullPreview.title }]
              const index = fullPreview.index || 0
              const activeImage = images[index]
              const hasMultipleImages = images.length > 1
              const changeImage = (direction) => setFullPreview((preview) => ({
                ...preview,
                index: (index + direction + images.length) % images.length,
              }))
              return <div onClick={(event) => event.stopPropagation()} className="w-full max-w-5xl overflow-hidden rounded-2xl bg-[#111a09] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
                <p className="text-sm font-medium">{activeImage.title}</p>
                <button type="button" onClick={() => setFullPreview(null)} className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/15" aria-label="Close image preview">Close ×</button>
              </div>
              <div className="relative flex max-h-[75vh] items-center justify-center bg-black p-3">
                <Image src={activeImage.url} alt={activeImage.title} width={1280} height={720} unoptimized className="max-h-[calc(75vh-1.5rem)] w-auto max-w-full object-contain" />
                {hasMultipleImages && <>
                  <button type="button" onClick={() => changeImage(-1)} className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-2xl text-white transition hover:bg-black/85" aria-label="View previous image">‹</button>
                  <button type="button" onClick={() => changeImage(1)} className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-2xl text-white transition hover:bg-black/85" aria-label="View next image">›</button>
                </>}
              </div>
              <p className="px-4 py-3 text-center text-xs text-white/60">{hasMultipleImages ? `${index + 1} of ${images.length} · use the arrows to compare` : 'Press Escape or click outside this window to close.'}</p>
            </div>
            })()}
          </div>
        )}

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

            {!prediction && (
              <div className={`rounded-2xl border p-5 text-sm ${
                darkMode ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-100 bg-slate-50 text-slate-500'
              }`}>
                Click anywhere on the map to analyse that location for illegal mining.
              </div>
            )}

            {prediction && (
            <>
            <div className={`rounded-2xl border p-5 ${
              darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                  prediction.detection_level === 'high_confidence' ? 'bg-red-100 text-red-600' :
                  prediction.detection_level === 'detected' ? 'bg-orange-100 text-orange-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {prediction.detection_level === 'high_confidence' ? 'High-confidence mining area' :
                   prediction.detection_level === 'detected' ? 'Mining signal detected' :
                   'No mining detected'}
                </span>
                <span className="text-xs text-slate-400">Live model result</span>
              </div>
              <p className="text-lg font-bold">Selected location analysis</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100'}`}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Average tile probability</p>
                <p className="text-2xl font-bold text-[#4a5e1a]">{(prediction.probability * 100).toFixed(2)}%</p>
                <p className="mt-1 text-[10px] leading-tight text-slate-400">Not a detection confidence</p>
              </div>
              <div className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100'}`}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Affected area</p>
                <p className="text-2xl font-bold text-[#4a5e1a]">{(prediction.affected_area_m2 / 10000).toFixed(2)} ha</p>
                <p className="mt-1 text-[10px] leading-tight text-slate-400">Confirmed mining pixels only</p>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100'}`}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Largest connected mining region</p>
              <p className="text-2xl font-bold text-[#4a5e1a]">{prediction.largest_component_pixels} px</p>
              <p className="mt-1 text-xs text-slate-400">{((prediction.largest_component_pixels * 100) / 10000).toFixed(2)} ha · regions under 25 px are not confirmed</p>
            </div>

            <div className={`rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100'}`}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Selected coordinates</p>
              <p className="text-sm font-medium">{prediction.latitude.toFixed(5)}°, {prediction.longitude.toFixed(5)}°</p>
              <p className="text-xs text-slate-400 mt-2">Model: {prediction.model_version}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Selected satellite area</p>
                <button onClick={() => setFullPreview({ url: prediction.previewUrl, title: 'Satellite image centred on the analysed location' })} className="text-xs text-[#4a5e1a] font-medium hover:underline">View full image</button>
              </div>
              <div className="relative rounded-2xl overflow-hidden h-44 bg-slate-200">
                <Image src={prediction.previewUrl} alt="Satellite image centred on the analysed location" width={640} height={360} unoptimized className="w-full h-full object-cover" />
                <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500/70 shadow-[0_0_0_5px_rgba(239,68,68,0.25)]" />
                <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded-lg">Analysed location</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Change over time</p>
              {comparisonLoading && (
                <div className={`rounded-2xl border p-4 text-xs ${darkMode ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                  Fetching matching Sentinel-2 views from 2016 and the latest available scene…
                </div>
              )}
              {comparisonError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                  Historical comparison unavailable: {comparisonError}
                </div>
              )}
              {comparison && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: `Before · ${comparison.before.captured_at}`, image: comparison.before },
                    { label: `Latest · ${comparison.current.captured_at}`, image: comparison.current },
                  ].map(({ label, image }, index, allImages) => (
                    <button key={label} type="button" onClick={() => setFullPreview({
                      images: allImages.map(({ label: imageLabel, image: comparisonImage }) => ({ url: comparisonImage.image_url, title: imageLabel })),
                      index,
                      title: label,
                    })} className="text-left group">
                      <p className="mb-1 text-[10px] font-mono uppercase tracking-widest text-slate-400">{label}</p>
                      <Image src={image.image_url} alt={`Sentinel-2 view: ${label}`} width={512} height={512} unoptimized className="aspect-square w-full rounded-xl object-cover ring-1 ring-transparent transition group-hover:ring-[#4a5e1a]" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">Average tile probability includes the whole image, which is usually mostly non-mining land. Detection is based on connected pixels: 25 px (0.25 ha) confirms a signal and 100 px (1 ha) is high confidence.</p>
            </>
            )}

            <div className="flex flex-col gap-3 mt-auto">
              <Link href="/report" aria-disabled={!prediction} className={`w-full rounded-2xl text-center text-sm font-semibold py-4 transition ${prediction ? 'bg-[#4a5e1a] text-white hover:bg-[#3a4d12]' : 'pointer-events-none bg-slate-200 text-slate-400'}`}>
                ⚡ Escalate to Local Authorities
              </Link>
              <button onClick={downloadPrediction} disabled={!prediction} className={`w-full rounded-2xl border text-sm font-medium py-4 transition ${prediction ? (darkMode ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-200 text-slate-800 hover:bg-slate-50') : 'cursor-not-allowed border-slate-100 text-slate-400'}`}>
                Download Analysis (JSON)
              </button>
            </div>

            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 text-center pt-2">
              System: Online
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
