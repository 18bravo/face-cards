'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { UnitMarker } from '@/types/military'
import { FACTION_COLORS, UNIT_TYPE_ICONS, THEATERS } from '@/types/military'

// Detection ranges by unit type (km) — must match simulation-engine.ts
const DETECTION_RANGES: Record<string, number> = {
  AIR_ISR: 500, AIR_FIGHTER: 300, NAVAL_SURFACE: 200, CARRIER_GROUP: 250,
  AIR_DEFENSE: 150, COMMAND: 100, UAV: 350, DEFAULT: 80,
}

function getDetectionRange(unitType: string): number {
  return DETECTION_RANGES[unitType] ?? DETECTION_RANGES.DEFAULT
}

// Convert km to degrees (approximate, for circle rendering)
function kmToDeg(km: number): number {
  return km / 111.32
}

function isHostile(a: UnitMarker, b: UnitMarker): boolean {
  if (a.faction === b.faction) return false
  if (a.faction === 'NEUTRAL' || b.faction === 'NEUTRAL') return false
  if ((a.faction === 'BLUE' && b.faction === 'GREEN') || (a.faction === 'GREEN' && b.faction === 'BLUE')) return false
  return true
}

interface TacticalMapProps {
  units: UnitMarker[]
  selectedTheater?: string
  onUnitSelect?: (unit: UnitMarker) => void
  onMapClick?: (lat: number, lon: number) => void
  detections?: Map<string, Set<string>>
  showDetectionRings?: boolean
}

export default function TacticalMap({
  units,
  selectedTheater = 'GLOBAL',
  onUnitSelect,
  onMapClick,
  detections,
  showDetectionRings = true,
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)
  const [maplibre, setMaplibre] = useState<typeof import('maplibre-gl') | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadMapLibre() {
      try {
        const ml = await import('maplibre-gl')
        if (mounted) setMaplibre(ml)
      } catch (err) {
        console.error('MapLibre load error:', err)
      }
    }
    loadMapLibre()
    return () => { mounted = false }
  }, [])

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
            tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; CartoDB &copy; OSM',
          },
        },
        layers: [{
          id: 'dark-base',
          type: 'raster',
          source: 'dark-tiles',
          minzoom: 0,
          maxzoom: 19,
        }],
      },
      center: [theater.center.longitude, theater.center.latitude],
      zoom: theater.zoomLevel,
      attributionControl: false,
    })

    map.on('load', () => {
      // Add sources for detection rings and engagement lines
      map.addSource('detection-rings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addSource('engagement-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // Detection ring layer (translucent circles)
      map.addLayer({
        id: 'detection-rings-fill',
        type: 'fill',
        source: 'detection-rings',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.05,
        },
      })
      map.addLayer({
        id: 'detection-rings-border',
        type: 'line',
        source: 'detection-rings',
        paint: {
          'line-color': ['get', 'color'],
          'line-opacity': 0.2,
          'line-width': 1,
          'line-dasharray': [4, 4],
        },
      })

      // Engagement lines layer (red lines between fighting units)
      map.addLayer({
        id: 'engagement-lines-layer',
        type: 'line',
        source: 'engagement-lines',
        paint: {
          'line-color': '#ef4444',
          'line-opacity': 0.7,
          'line-width': 2,
        },
      })

      setIsLoaded(true)
    })

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

  // Update GeoJSON layers (detection rings + engagement lines)
  const updateLayers = useCallback(() => {
    if (!mapRef.current || !isLoaded) return
    const map = mapRef.current

    // Detection rings
    if (showDetectionRings) {
      const ringFeatures = units
        .filter(u => u.status !== 'DESTROYED')
        .map(u => {
          const rangeKm = getDetectionRange(u.unitType)
          const rangeDeg = kmToDeg(rangeKm)
          const color = FACTION_COLORS[u.faction] || '#ffffff'
          // Create circle polygon (32 segments)
          const coords: [number, number][] = []
          for (let i = 0; i <= 32; i++) {
            const angle = (i / 32) * 2 * Math.PI
            coords.push([
              u.position.longitude + rangeDeg * Math.cos(angle) / Math.cos(u.position.latitude * Math.PI / 180),
              u.position.latitude + rangeDeg * Math.sin(angle),
            ])
          }
          return {
            type: 'Feature' as const,
            properties: { color, unitId: u.id },
            geometry: { type: 'Polygon' as const, coordinates: [coords] },
          }
        })

      const src = map.getSource('detection-rings') as maplibregl.GeoJSONSource | undefined
      if (src) {
        src.setData({ type: 'FeatureCollection', features: ringFeatures })
      }
    }

    // Engagement lines
    const engaged = units.filter(u => u.status === 'ENGAGED')
    const lineFeatures: GeoJSON.Feature[] = []
    const drawn = new Set<string>()
    for (const a of engaged) {
      for (const b of engaged) {
        if (a.id >= b.id) continue
        if (!isHostile(a, b)) continue
        const key = `${a.id}-${b.id}`
        if (drawn.has(key)) continue
        drawn.add(key)
        lineFeatures.push({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [a.position.longitude, a.position.latitude],
              [b.position.longitude, b.position.latitude],
            ],
          },
        })
      }
    }

    const engSrc = map.getSource('engagement-lines') as maplibregl.GeoJSONSource | undefined
    if (engSrc) {
      engSrc.setData({ type: 'FeatureCollection', features: lineFeatures })
    }
  }, [units, isLoaded, showDetectionRings])

  // Update markers
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !maplibre || !isLoaded) return
    const map = mapRef.current

    const currentIds = new Set(units.map(u => u.id))

    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }

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
        existing.setLngLat([unit.position.longitude, unit.position.latitude])
        const el = existing.getElement()
        const label = el.querySelector('.unit-label')
        if (label) label.textContent = `${icon} ${unit.designation}`
        const statusEl = el.querySelector('.unit-status')
        if (statusEl) {
          statusEl.textContent = `${unit.status} ${unit.strength.toLocaleString()}`
          statusEl.className = `unit-status ${
            unit.status === 'ENGAGED' ? 'engaged' :
            unit.status === 'MOVING' ? 'moving' : 'ready'
          }`
        }
      } else {
        const el = document.createElement('div')
        el.className = 'tactical-unit-marker'
        el.style.cssText = 'cursor:pointer;text-align:center;'

        const dot = document.createElement('div')
        dot.style.cssText = `width:${unit.echelon === 'FLEET' || unit.echelon === 'CORPS' || unit.echelon === 'ARMY_LEVEL' || unit.echelon === 'THEATER' ? '14' : '10'}px;height:${unit.echelon === 'FLEET' || unit.echelon === 'CORPS' || unit.echelon === 'ARMY_LEVEL' || unit.echelon === 'THEATER' ? '14' : '10'}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.3);margin:0 auto;`
        if (unit.status === 'ENGAGED') dot.style.boxShadow = `0 0 12px ${color}, 0 0 24px rgba(239,68,68,0.5)`
        else if (unit.status === 'MOVING') dot.style.boxShadow = `0 0 8px ${color}`

        const label = document.createElement('div')
        label.className = 'unit-label'
        label.style.cssText = `font-family:monospace;font-size:10px;color:${color};white-space:nowrap;margin-top:2px;text-shadow:0 0 4px rgba(0,0,0,0.9);`
        label.textContent = `${icon} ${unit.designation}`

        const statusEl = document.createElement('div')
        statusEl.className = `unit-status ${unit.status === 'ENGAGED' ? 'engaged' : unit.status === 'MOVING' ? 'moving' : 'ready'}`
        statusEl.style.cssText = `font-family:monospace;font-size:8px;color:${unit.status === 'ENGAGED' ? '#ef4444' : unit.status === 'MOVING' ? '#f59e0b' : '#22c55e'};`
        statusEl.textContent = `${unit.status} ${unit.strength.toLocaleString()}`

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
    if (isLoaded) {
      updateMarkers()
      updateLayers()
    }
  }, [isLoaded, updateMarkers, updateLayers])

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

      {isLoaded && (
        <div className="absolute bottom-4 left-4 hud-panel p-3 space-y-1">
          <div className="hud-label mb-2">Forces</div>
          {Object.entries(FACTION_COLORS).map(([faction, color]) => {
            const alive = units.filter(u => u.faction === faction && u.status !== 'DESTROYED')
            if (alive.length === 0) return null
            const str = alive.reduce((s, u) => s + u.strength, 0)
            return (
              <div key={faction} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-mono">{faction}</span>
                <span className="text-gray-500">{alive.length} units · {(str / 1000).toFixed(0)}K</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
