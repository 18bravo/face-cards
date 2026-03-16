'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { UnitMarker } from '@/types/military'
import { FACTION_COLORS, UNIT_TYPE_ICONS, THEATERS } from '@/types/military'

// CesiumJS is loaded dynamically to avoid SSR issues
let Cesium: typeof import('cesium') | null = null

interface GlobeViewerProps {
  units: UnitMarker[]
  selectedTheater?: string
  onUnitSelect?: (unit: UnitMarker) => void
  onMapClick?: (lat: number, lon: number) => void
  simulationActive?: boolean
}

export default function GlobeViewer({
  units,
  selectedTheater = 'GLOBAL',
  onUnitSelect,
  onMapClick,
  simulationActive = false,
}: GlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<InstanceType<typeof import('cesium').Viewer> | null>(null)
  const entitiesRef = useRef<Map<string, unknown>>(new Map())
  const arcsRef = useRef<Map<string, unknown>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Cesium viewer
  useEffect(() => {
    let mounted = true

    async function initCesium() {
      try {
        const cesiumModule = await import('cesium')
        Cesium = cesiumModule

        // Set the base URL for Cesium assets
        ;(window as unknown as Record<string, unknown>).CESIUM_BASE_URL = '/cesium'

        if (!containerRef.current || !mounted) return

        const viewer = new cesiumModule.Viewer(containerRef.current, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          vrButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: true,
          timeline: simulationActive,
          navigationHelpButton: false,
          creditContainer: document.createElement('div'), // hide credits
          baseLayer: false, // we'll add our own
          terrain: cesiumModule.Terrain.fromWorldTerrain(),
        })

        // Dark theme imagery
        viewer.imageryLayers.addImageryProvider(
          new cesiumModule.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maximumLevel: 19,
          })
        )

        // Dark atmosphere
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.brightnessShift = -0.3
        }
        viewer.scene.fog.enabled = true
        if (viewer.scene.globe) {
          viewer.scene.globe.enableLighting = true
          viewer.scene.globe.atmosphereLightIntensity = 10
        }

        // Click handler
        const handler = new cesiumModule.ScreenSpaceEventHandler(viewer.scene.canvas)
        handler.setInputAction((movement: unknown) => {
          const click = movement as { position: import('cesium').Cartesian2 }
          const picked = viewer.scene.pick(click.position)
          if (cesiumModule.defined(picked) && picked.id?._unitData) {
            onUnitSelect?.(picked.id._unitData as UnitMarker)
          } else if (viewer.scene.globe) {
            const cartesian = viewer.camera.pickEllipsoid(
              click.position,
              viewer.scene.globe.ellipsoid
            )
            if (cartesian) {
              const cartographic = cesiumModule.Cartographic.fromCartesian(cartesian)
              onMapClick?.(
                cesiumModule.Math.toDegrees(cartographic.latitude),
                cesiumModule.Math.toDegrees(cartographic.longitude)
              )
            }
          }
        }, cesiumModule.ScreenSpaceEventType.LEFT_CLICK)

        viewerRef.current = viewer
        if (mounted) setIsLoaded(true)
      } catch (err) {
        console.error('Cesium init error:', err)
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load CesiumJS')
      }
    }

    initCesium()

    return () => {
      mounted = false
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update units on the globe
  const updateUnits = useCallback(() => {
    if (!viewerRef.current || !Cesium) return
    const viewer = viewerRef.current

    // Remove stale entities
    const currentIds = new Set(units.map(u => u.id))
    for (const [id, entity] of entitiesRef.current) {
      if (!currentIds.has(id)) {
        viewer.entities.remove(entity as import('cesium').Entity)
        entitiesRef.current.delete(id)
      }
    }

    // Remove old engagement arcs
    for (const [id, entity] of arcsRef.current) {
      viewer.entities.remove(entity as import('cesium').Entity)
    }
    arcsRef.current.clear()

    // Draw engagement arcs between ENGAGED units of opposing factions
    const engaged = units.filter(u => u.status === 'ENGAGED')
    const drawn = new Set<string>()
    for (const a of engaged) {
      for (const b of engaged) {
        if (a.id >= b.id) continue
        if (a.faction === b.faction) continue
        const key = `${a.id}-${b.id}`
        if (drawn.has(key)) continue
        drawn.add(key)

        const arc = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              a.position.longitude, a.position.latitude, 5000,
              b.position.longitude, b.position.latitude, 5000,
            ]),
            width: 2,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.3,
              color: Cesium.Color.RED.withAlpha(0.7),
            }),
            arcType: Cesium.ArcType.GEODESIC,
          },
        })
        arcsRef.current.set(key, arc)
      }
    }

    // Add/update units
    for (const unit of units) {
      if (unit.status === 'DESTROYED') {
        // Remove destroyed units from globe
        const existing = entitiesRef.current.get(unit.id)
        if (existing) {
          viewer.entities.remove(existing as import('cesium').Entity)
          entitiesRef.current.delete(unit.id)
        }
        continue
      }

      const color = Cesium.Color.fromCssColorString(FACTION_COLORS[unit.faction] || '#ffffff')
      const icon = UNIT_TYPE_ICONS[unit.unitType] || '●'
      const existing = entitiesRef.current.get(unit.id) as import('cesium').Entity | undefined

      if (existing) {
        // Update position
        existing.position = new Cesium.ConstantPositionProperty(
          Cesium.Cartesian3.fromDegrees(unit.position.longitude, unit.position.latitude, unit.position.altitude || 0)
        )
        // Update unit data for click handling
        ;(existing as unknown as Record<string, unknown>)._unitData = unit
      } else {
        // Create new entity
        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            unit.position.longitude,
            unit.position.latitude,
            unit.position.altitude || 100
          ),
          point: {
            pixelSize: unit.echelon === 'DIVISION' || unit.echelon === 'CORPS' ? 14 :
                       unit.echelon === 'BRIGADE' ? 12 : 10,
            color: color.withAlpha(0.9),
            outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          },
          label: {
            text: `${icon} ${unit.designation}`,
            font: '12px monospace',
            fillColor: color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -16),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000000),
            scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 5000000, 0.4),
          },
        })

        // Attach unit data for click handling
        ;(entity as unknown as Record<string, unknown>)._unitData = unit
        entitiesRef.current.set(unit.id, entity)
      }
    }
  }, [units])

  useEffect(() => {
    if (isLoaded) updateUnits()
  }, [isLoaded, updateUnits])

  // Fly to theater
  useEffect(() => {
    if (!viewerRef.current || !Cesium || !isLoaded) return
    const theater = THEATERS[selectedTheater]
    if (!theater) return

    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        theater.center.longitude,
        theater.center.latitude,
        theater.zoomLevel * 1000000
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 2,
    })
  }, [selectedTheater, isLoaded])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-red-400">
        <div className="text-center space-y-2">
          <p className="font-mono text-sm">GLOBE INITIALIZATION FAILED</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-sm text-cyan-400">INITIALIZING GLOBE</p>
            <p className="text-xs text-gray-500">Loading CesiumJS terrain data...</p>
          </div>
        </div>
      )}

      {/* Legend overlay */}
      {isLoaded && (
        <div className="absolute bottom-4 left-4 hud-panel p-3 space-y-1">
          <div className="hud-label mb-2">Forces</div>
          {Object.entries(FACTION_COLORS).map(([faction, color]) => {
            const count = units.filter(u => u.faction === faction).length
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
