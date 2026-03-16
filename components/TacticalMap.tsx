'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { UnitMarker } from '@/types/military'
import { FACTION_COLORS, UNIT_TYPE_ICONS, THEATERS } from '@/types/military'

interface TacticalMapProps {
  units: UnitMarker[]
  selectedTheater?: string
  onUnitSelect?: (unit: UnitMarker) => void
  onMapClick?: (lat: number, lon: number) => void
  detections?: Map<string, Set<string>>
}

export default function TacticalMap({
  units,
  selectedTheater = 'GLOBAL',
  onUnitSelect,
  onMapClick,
  detections,
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)
  const [maplibre, setMaplibre] = useState<typeof import('maplibre-gl') | null>(null)

  // Load MapLibre dynamically
  useEffect(() => {
    let mounted = true

    async function loadMapLibre() {
      try {
        const ml = await import('maplibre-gl')
        // CSS is loaded via link tag in layout or imported separately
        if (mounted) setMaplibre(ml)
      } catch (err) {
        console.error('MapLibre load error:', err)
      }
    }

    loadMapLibre()
    return () => { mounted = false }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!maplibre || !containerRef.current || mapRef.current) return

    const theater = THEATERS[selectedTheater] || THEATERS.GLOBAL

    const map = new maplibre.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'dark-tiles': {
            type: 'raster',
            tiles: [
              'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '&copy; CartoDB &copy; OSM',
          },
        },
        layers: [
          {
            id: 'dark-base',
            type: 'raster',
            source: 'dark-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [theater.center.longitude, theater.center.latitude],
      zoom: theater.zoomLevel,
      attributionControl: false,
    })

    map.on('load', () => setIsLoaded(true))

    map.on('click', (e) => {
      onMapClick?.(e.lngLat.lat, e.lngLat.lng)
    })

    mapRef.current = map

    return () => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
      setIsLoaded(false)
    }
  }, [maplibre]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !maplibre || !isLoaded) return
    const map = mapRef.current

    // Track which markers exist
    const currentIds = new Set(units.map(u => u.id))

    // Remove stale markers
    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }

    // Add/update markers
    for (const unit of units) {
      if (unit.status === 'DESTROYED') {
        const existing = markersRef.current.get(unit.id)
        if (existing) {
          existing.remove()
          markersRef.current.delete(unit.id)
        }
        continue
      }

      const color = FACTION_COLORS[unit.faction] || '#ffffff'
      const icon = UNIT_TYPE_ICONS[unit.unitType] || '●'
      const existing = markersRef.current.get(unit.id)

      if (existing) {
        // Update position
        existing.setLngLat([unit.position.longitude, unit.position.latitude])
        // Update marker content
        const el = existing.getElement()
        const label = el.querySelector('.unit-label')
        if (label) {
          label.textContent = `${icon} ${unit.designation}`
        }
        const status = el.querySelector('.unit-status')
        if (status) {
          status.textContent = unit.status
          status.className = `unit-status text-[8px] font-mono ${
            unit.status === 'ENGAGED' ? 'text-red-400' :
            unit.status === 'MOVING' ? 'text-amber-400' :
            unit.status === 'DESTROYED' ? 'text-gray-600' :
            'text-green-400'
          }`
        }
      } else {
        // Create marker element
        const el = document.createElement('div')
        el.className = 'tactical-unit-marker'
        el.style.cssText = 'cursor:pointer;text-align:center;'

        // Main dot
        const dot = document.createElement('div')
        dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.3);margin:0 auto;position:relative;`

        // Pulse for engaged/moving
        if (unit.status === 'ENGAGED' || unit.status === 'MOVING') {
          dot.style.boxShadow = `0 0 8px ${color}`
        }

        // Label
        const label = document.createElement('div')
        label.className = 'unit-label'
        label.style.cssText = `font-family:monospace;font-size:10px;color:${color};white-space:nowrap;margin-top:2px;text-shadow:0 0 4px rgba(0,0,0,0.9);`
        label.textContent = `${icon} ${unit.designation}`

        // Status
        const statusEl = document.createElement('div')
        statusEl.className = `unit-status text-[8px] font-mono ${
          unit.status === 'ENGAGED' ? 'text-red-400' :
          unit.status === 'MOVING' ? 'text-amber-400' :
          'text-green-400'
        }`
        statusEl.style.cssText = 'font-family:monospace;font-size:8px;'
        statusEl.textContent = unit.status

        el.appendChild(dot)
        el.appendChild(label)
        el.appendChild(statusEl)

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onUnitSelect?.(unit)
        })

        const marker = new maplibre.Marker({ element: el })
          .setLngLat([unit.position.longitude, unit.position.latitude])
          .addTo(map)

        markersRef.current.set(unit.id, marker)
      }
    }
  }, [units, maplibre, isLoaded, onUnitSelect])

  useEffect(() => {
    if (isLoaded) updateMarkers()
  }, [isLoaded, updateMarkers])

  // Fly to theater on change
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const theater = THEATERS[selectedTheater]
    if (!theater) return

    mapRef.current.flyTo({
      center: [theater.center.longitude, theater.center.latitude],
      zoom: theater.zoomLevel,
      duration: 2000,
    })
  }, [selectedTheater, isLoaded])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-sm text-cyan-400">LOADING TACTICAL MAP</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {isLoaded && (
        <div className="absolute bottom-4 left-4 hud-panel p-3 space-y-1">
          <div className="hud-label mb-2">Forces</div>
          {Object.entries(FACTION_COLORS).map(([faction, color]) => {
            const count = units.filter(u => u.faction === faction && u.status !== 'DESTROYED').length
            if (count === 0) return null
            return (
              <div key={faction} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-mono">{faction}</span>
                <span className="text-gray-500">{count} units</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
