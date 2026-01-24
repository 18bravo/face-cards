'use client'

import React, { useState, useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Stars,
  Html,
  Line,
  Float,
} from '@react-three/drei'
import * as THREE from 'three'

/**
 * DEFENSE ENTERPRISE 3D LEARNING SYSTEM
 * Immersive visualization for understanding DoD structure and processes
 *
 * Views:
 * 1. Strategic Globe - Geographic CCMD visualization
 * 2. Org Constellation - 3D organizational hierarchy
 * 3. PPBE Flow - Resource allocation particle system
 * 4. Strategy Cascade - Waterfall of strategic guidance
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════════

const CCMD_DATA = [
  { name: 'USINDOPACOM', abbrev: 'INDOPACOM', lat: 21.35, lon: -157.95, hq: 'Hawaii', color: '#3b82f6',
    mission: 'Indo-Pacific region security and stability' },
  { name: 'USEUCOM', abbrev: 'EUCOM', lat: 48.87, lon: 8.65, hq: 'Germany', color: '#8b5cf6',
    mission: 'European theater operations and NATO integration' },
  { name: 'USCENTCOM', abbrev: 'CENTCOM', lat: 27.85, lon: 50.60, hq: 'Tampa, FL', color: '#ef4444',
    mission: 'Middle East and Central Asia operations' },
  { name: 'USAFRICOM', abbrev: 'AFRICOM', lat: 0, lon: 20, hq: 'Germany', color: '#f97316',
    mission: 'African continent security cooperation' },
  { name: 'USSOUTHCOM', abbrev: 'SOUTHCOM', lat: -15, lon: -60, hq: 'Miami, FL', color: '#22c55e',
    mission: 'Central and South America partnership' },
  { name: 'USNORTHCOM', abbrev: 'NORTHCOM', lat: 38.82, lon: -104.70, hq: 'Colorado', color: '#06b6d4',
    mission: 'Homeland defense and civil support' },
]

const FUNCTIONAL_CCMD_DATA = [
  { name: 'USSOCOM', abbrev: 'SOCOM', color: '#dc2626', mission: 'Special Operations Forces' },
  { name: 'USTRANSCOM', abbrev: 'TRANSCOM', color: '#7c3aed', mission: 'Global Mobility' },
  { name: 'USSTRATCOM', abbrev: 'STRATCOM', color: '#0891b2', mission: 'Strategic Deterrence' },
  { name: 'USCYBERCOM', abbrev: 'CYBERCOM', color: '#059669', mission: 'Cyberspace Operations' },
  { name: 'USSPACECOM', abbrev: 'SPACECOM', color: '#4f46e5', mission: 'Space Operations' },
]

const STRATEGIC_CASCADE = [
  { level: 0, name: 'National Security Strategy', abbrev: 'NSS', color: '#dc2626',
    source: 'President', y: 4 },
  { level: 1, name: 'National Defense Strategy', abbrev: 'NDS', color: '#f97316',
    source: 'SecDef', y: 2.5 },
  { level: 2, name: 'National Military Strategy', abbrev: 'NMS', color: '#eab308',
    source: 'CJCS', y: 1 },
  { level: 3, name: 'Army Strategy', abbrev: 'TAS', color: '#22c55e',
    source: 'SA/CSA', y: -0.5 },
  { level: 4, name: 'Army Campaign Plan', abbrev: 'ACP', color: '#3b82f6',
    source: 'CSA', y: -2 },
]

const ORG_NODES = [
  // Center - DoD
  { id: 'dod', name: 'Department of Defense', abbrev: 'DoD', x: 0, y: 0, z: 0,
    size: 1.2, color: '#fbbf24', level: 0 },

  // Ring 1 - Major Components
  { id: 'osd', name: 'Office of Secretary of Defense', abbrev: 'OSD',
    x: 3, y: 1, z: 0, size: 0.6, color: '#8b5cf6', level: 1, parent: 'dod' },
  { id: 'jcs', name: 'Joint Chiefs of Staff', abbrev: 'JCS',
    x: -2, y: 1.5, z: 2, size: 0.6, color: '#3b82f6', level: 1, parent: 'dod' },
  { id: 'army', name: 'Department of the Army', abbrev: 'Army',
    x: -3, y: -0.5, z: -1, size: 0.7, color: '#22c55e', level: 1, parent: 'dod' },
  { id: 'navy', name: 'Department of the Navy', abbrev: 'Navy',
    x: 1, y: -1, z: 3, size: 0.7, color: '#0ea5e9', level: 1, parent: 'dod' },
  { id: 'af', name: 'Department of the Air Force', abbrev: 'AF',
    x: 2, y: -1.5, z: -2, size: 0.7, color: '#6366f1', level: 1, parent: 'dod' },

  // Ring 2 - Army Commands
  { id: 'amc', name: 'Army Materiel Command', abbrev: 'AMC',
    x: -5, y: 0, z: -2, size: 0.4, color: '#84cc16', level: 2, parent: 'army' },
  { id: 'tradoc', name: 'Training & Doctrine Command', abbrev: 'TRADOC',
    x: -5, y: -1.5, z: 0.5, size: 0.4, color: '#84cc16', level: 2, parent: 'army' },
  { id: 'forscom', name: 'Forces Command', abbrev: 'FORSCOM',
    x: -4, y: -2, z: -2.5, size: 0.4, color: '#84cc16', level: 2, parent: 'army' },
  { id: 'afc', name: 'Army Futures Command', abbrev: 'AFC',
    x: -4.5, y: 1, z: -0.5, size: 0.4, color: '#84cc16', level: 2, parent: 'army' },
]

const PPBE_STAGES = [
  { id: 'planning', name: 'Planning', color: '#3b82f6', x: -6 },
  { id: 'programming', name: 'Programming', color: '#8b5cf6', x: -2 },
  { id: 'budgeting', name: 'Budgeting', color: '#f59e0b', x: 2 },
  { id: 'execution', name: 'Execution', color: '#22c55e', x: 6 },
]

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface CCMDData {
  name: string
  abbrev: string
  lat: number
  lon: number
  hq: string
  color: string
  mission: string
}

interface OrgNode {
  id: string
  name: string
  abbrev: string
  x: number
  y: number
  z: number
  size: number
  color: string
  level: number
  parent?: string
}

interface StrategicLevel {
  level: number
  name: string
  abbrev: string
  color: string
  source: string
  y: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Glowing Node Component
function GlowingNode({
  position,
  size,
  color,
  abbrev,
  isSelected,
  onClick
}: {
  position: [number, number, number]
  size: number
  color: string
  abbrev: string
  isSelected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05
      meshRef.current.scale.setScalar(isSelected ? size * 1.3 : size * scale)
    }
    if (glowRef.current && glowRef.current.material) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1
    }
  })

  return (
    <group position={position} onClick={onClick}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* Main sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : 0.4}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Label */}
      <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          padding: '4px 8px',
          borderRadius: '4px',
          border: `1px solid ${color}`,
          whiteSpace: 'nowrap',
          fontSize: '12px',
          color: '#fff',
          fontWeight: 600,
        }}>
          {abbrev}
        </div>
      </Html>
    </group>
  )
}

// Connection Line between nodes
function ConnectionLine({
  start,
  end,
  color
}: {
  start: [number, number, number]
  end: [number, number, number]
  color: string
}) {
  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2 + 1,
        (start[2] + end[2]) / 2
      ),
      new THREE.Vector3(...end)
    )
    return curve.getPoints(50)
  }, [start, end])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.4}
    />
  )
}

// Globe Component
function Globe({
  onSelectCCMD,
  selectedCCMD
}: {
  onSelectCCMD: (ccmd: CCMDData) => void
  selectedCCMD: CCMDData | null
}) {
  const globeRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001
    }
    if (atmosphereRef.current && atmosphereRef.current.material) {
      const mat = atmosphereRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime) * 0.05
    }
  })

  // Convert lat/lon to 3D position
  const latLonToPos = (lat: number, lon: number, radius = 2.1): [number, number, number] => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    return [
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    ]
  }

  return (
    <group>
      {/* Globe sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#1e3a5f"
          roughness={0.8}
          metalness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={1.1}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>

      {/* Grid lines */}
      <mesh>
        <sphereGeometry args={[2.01, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.1} />
      </mesh>

      {/* CCMD Markers */}
      {CCMD_DATA.map((ccmd) => {
        const pos = latLonToPos(ccmd.lat, ccmd.lon)
        const isSelected = selectedCCMD?.abbrev === ccmd.abbrev
        return (
          <group key={ccmd.abbrev}>
            {/* Marker */}
            <mesh
              position={pos}
              onClick={(e) => { e.stopPropagation(); onSelectCCMD(ccmd) }}
            >
              <sphereGeometry args={[isSelected ? 0.15 : 0.1, 16, 16]} />
              <meshStandardMaterial
                color={ccmd.color}
                emissive={ccmd.color}
                emissiveIntensity={isSelected ? 1 : 0.5}
              />
            </mesh>

            {/* Pulse ring */}
            <mesh position={pos} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.12, 0.18, 32]} />
              <meshBasicMaterial color={ccmd.color} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>

            {/* Label */}
            <Html position={[pos[0] * 1.15, pos[1] * 1.15, pos[2] * 1.15]} center>
              <div style={{
                fontSize: '10px',
                color: ccmd.color,
                fontWeight: 700,
                textShadow: '0 0 10px rgba(0,0,0,0.8)',
                cursor: 'pointer',
              }} onClick={() => onSelectCCMD(ccmd)}>
                {ccmd.abbrev}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// Particle Flow for PPBE
function ParticleFlow({ count = 500 }: { count?: number }) {
  const particlesRef = useRef<THREE.Points>(null)

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Start positions spread across the flow
      positions[i * 3] = Math.random() * 16 - 8 // x: -8 to 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4 // y: -2 to 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2 // z: -1 to 1

      // Color based on position (stage)
      const x = positions[i * 3]
      let color: THREE.Color
      if (x < -4) color = new THREE.Color('#3b82f6')
      else if (x < 0) color = new THREE.Color('#8b5cf6')
      else if (x < 4) color = new THREE.Color('#f59e0b')
      else color = new THREE.Color('#22c55e')

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      speeds[i] = 0.02 + Math.random() * 0.03
    }

    return { positions, colors, speeds }
  }, [count])

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const colors = particlesRef.current.geometry.attributes.color.array as Float32Array

      for (let i = 0; i < count; i++) {
        // Move particles to the right
        positions[i * 3] += particles.speeds[i]

        // Reset when off screen
        if (positions[i * 3] > 8) {
          positions[i * 3] = -8
          positions[i * 3 + 1] = (Math.random() - 0.5) * 4
        }

        // Update color based on new position
        const x = positions[i * 3]
        let color: THREE.Color
        if (x < -4) color = new THREE.Color('#3b82f6')
        else if (x < 0) color = new THREE.Color('#8b5cf6')
        else if (x < 4) color = new THREE.Color('#f59e0b')
        else color = new THREE.Color('#22c55e')

        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.color.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

// Strategic Cascade Waterfall
function StrategicWaterfall({
  onSelect,
  selected
}: {
  onSelect: (level: StrategicLevel) => void
  selected: StrategicLevel | null
}) {
  return (
    <group>
      {STRATEGIC_CASCADE.map((level, idx) => (
        <Float key={level.abbrev} speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
          <group position={[0, level.y, idx * 0.5]}>
            {/* Platform */}
            <mesh
              onClick={() => onSelect(level)}
              position={[0, 0, 0]}
            >
              <boxGeometry args={[3 - idx * 0.3, 0.3, 1.5 - idx * 0.15]} />
              <meshStandardMaterial
                color={level.color}
                emissive={level.color}
                emissiveIntensity={selected?.abbrev === level.abbrev ? 0.6 : 0.2}
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>

            {/* Label */}
            <Html position={[0, 0.5, 0]} center>
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                padding: '6px 12px',
                borderRadius: '6px',
                border: `2px solid ${level.color}`,
                textAlign: 'center',
                cursor: 'pointer',
              }} onClick={() => onSelect(level)}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: level.color
                }}>
                  {level.abbrev}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {level.source}
                </div>
              </div>
            </Html>

            {/* Connection to next level */}
            {idx < STRATEGIC_CASCADE.length - 1 && (
              <mesh position={[0, -0.7, 0.25]} rotation={[0.3, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
                <meshStandardMaterial
                  color={level.color}
                  transparent
                  opacity={0.5}
                  emissive={level.color}
                  emissiveIntensity={0.3}
                />
              </mesh>
            )}
          </group>
        </Float>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

// Globe View
function GlobeView() {
  const [selectedCCMD, setSelectedCCMD] = useState<CCMDData | null>(null)

  return (
    <>
      <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />

        <Stars radius={100} depth={50} count={3000} factor={4} fade speed={1} />

        <Suspense fallback={null}>
          <Globe onSelectCCMD={setSelectedCCMD} selectedCCMD={selectedCCMD} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={12}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Info Panel */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(251,191,36,0.3)',
        maxWidth: '300px',
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#fbbf24' }}>
          Geographic Combatant Commands
        </h3>
        {selectedCCMD ? (
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: selectedCCMD.color,
              marginBottom: '8px',
            }}>
              {selectedCCMD.name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
              HQ: {selectedCCMD.hq}
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
              {selectedCCMD.mission}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            Click a command marker on the globe to see details.
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
              Drag to rotate - Scroll to zoom
            </div>
          </div>
        )}
      </div>

      {/* Functional CCMDs */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        maxWidth: 'calc(100% - 40px)',
      }}>
        {FUNCTIONAL_CCMD_DATA.map(ccmd => (
          <div key={ccmd.abbrev} style={{
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${ccmd.color}`,
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ccmd.color }}>
              {ccmd.abbrev}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>
              {ccmd.mission}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// Organization Constellation View
function ConstellationView() {
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null)

  return (
    <>
      <Canvas camera={{ position: [0, 2, 10], fov: 60 }}>
        <color attach="background" args={['#050810']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#fbbf24" />

        <Stars radius={100} depth={50} count={5000} factor={4} fade speed={0.5} />

        {/* Org Nodes */}
        {ORG_NODES.map(node => (
          <GlowingNode
            key={node.id}
            position={[node.x, node.y, node.z]}
            size={node.size}
            color={node.color}
            abbrev={node.abbrev}
            isSelected={selectedNode?.id === node.id}
            onClick={() => setSelectedNode(node)}
          />
        ))}

        {/* Connections */}
        {ORG_NODES.filter(n => n.parent).map(node => {
          const parent = ORG_NODES.find(p => p.id === node.parent)
          if (!parent) return null
          return (
            <ConnectionLine
              key={`${parent.id}-${node.id}`}
              start={[parent.x, parent.y, parent.z]}
              end={[node.x, node.y, node.z]}
              color={node.color}
            />
          )
        })}

        <OrbitControls
          enablePan
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>

      {/* Info Panel */}
      <div style={{
        position: 'absolute',
        top: '80px',
        right: '20px',
        background: 'rgba(0,0,0,0.85)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(251,191,36,0.3)',
        maxWidth: '280px',
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#fbbf24' }}>
          DoD Organization Constellation
        </h3>
        {selectedNode ? (
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: selectedNode.color,
              marginBottom: '6px',
            }}>
              {selectedNode.name}
            </div>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              background: `${selectedNode.color}30`,
              border: `1px solid ${selectedNode.color}`,
              borderRadius: '4px',
              fontSize: '12px',
              color: selectedNode.color,
            }}>
              {selectedNode.abbrev}
            </span>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              Level {selectedNode.level} - {
                selectedNode.level === 0 ? 'Department' :
                selectedNode.level === 1 ? 'Major Component' : 'Command'
              }
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            Click any node to explore the DoD organizational structure.
          </div>
        )}
      </div>
    </>
  )
}

// PPBE Flow View
function PPBEFlowView() {
  return (
    <>
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.3} />

        {/* Stage Labels */}
        {PPBE_STAGES.map(stage => (
          <group key={stage.id} position={[stage.x, 3, 0]}>
            <Html center>
              <div style={{
                background: `${stage.color}20`,
                border: `2px solid ${stage.color}`,
                padding: '12px 24px',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: stage.color }}>
                  {stage.name}
                </div>
              </div>
            </Html>

            {/* Stage indicator bar */}
            <mesh position={[0, -1.5, 0]}>
              <boxGeometry args={[3, 0.1, 0.5]} />
              <meshStandardMaterial
                color={stage.color}
                emissive={stage.color}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        ))}

        {/* Particle Flow */}
        <ParticleFlow count={800} />

        {/* Flow tunnel */}
        <mesh position={[0, 0, -0.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[2.5, 2.5, 20, 32, 1, true]} />
          <meshBasicMaterial
            color="#1e3a5f"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            wireframe
          />
        </mesh>

        <Stars radius={100} depth={50} count={2000} factor={4} fade />

        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>

      {/* Info Panel */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)',
        padding: '15px 30px',
        borderRadius: '12px',
        border: '1px solid rgba(251,191,36,0.3)',
        textAlign: 'center',
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#fbbf24' }}>
          PPBE Resource Flow
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
          Watch defense dollars flow through the Planning → Programming → Budgeting → Execution cycle
        </p>
      </div>
    </>
  )
}

// Strategy Cascade View
function StrategyCascadeView() {
  const [selected, setSelected] = useState<StrategicLevel | null>(null)

  return (
    <>
      <Canvas camera={{ position: [5, 2, 5], fov: 50 }}>
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#8b5cf6" />

        <Stars radius={100} depth={50} count={3000} factor={4} fade />

        <StrategicWaterfall onSelect={setSelected} selected={selected} />

        <OrbitControls
          target={[0, 1, 0]}
          minDistance={6}
          maxDistance={15}
        />
      </Canvas>

      {/* Info Panel */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        background: 'rgba(0,0,0,0.85)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(251,191,36,0.3)',
        maxWidth: '320px',
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#fbbf24' }}>
          Strategic Guidance Cascade
        </h3>
        {selected ? (
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: selected.color,
              marginBottom: '6px',
            }}>
              {selected.name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
              Source: {selected.source}
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
              Level {selected.level + 1} of 5 in the strategic guidance hierarchy.
              {selected.level === 0 && ' Sets national security objectives and priorities.'}
              {selected.level === 1 && ' Translates national strategy into defense priorities.'}
              {selected.level === 2 && ' Describes how the Joint Force supports defense objectives.'}
              {selected.level === 3 && ' Guides Army transformation and resource priorities.'}
              {selected.level === 4 && ' Operationalizes strategy into executable tasks.'}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            Strategy flows down from national to operational levels. Click any tier to learn more.
          </div>
        )}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

const VIEWS = [
  { id: 'globe', label: 'Globe', component: GlobeView },
  { id: 'constellation', label: 'Organization', component: ConstellationView },
  { id: 'ppbe', label: 'PPBE Flow', component: PPBEFlowView },
  { id: 'cascade', label: 'Strategy', component: StrategyCascadeView },
]

export default function DefenseEnterprise3D() {
  const [activeView, setActiveView] = useState('globe')

  const ActiveComponent = VIEWS.find(v => v.id === activeView)?.component || GlobeView

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: '#0a0f1a',
      position: 'relative',
      fontFamily: '"IBM Plex Sans", -apple-system, sans-serif',
    }}>
      {/* 3D Canvas */}
      <div style={{ width: '100%', height: '100%' }}>
        <ActiveComponent />
      </div>

      {/* Navigation */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        background: 'rgba(0,0,0,0.8)',
        padding: '8px',
        borderRadius: '12px',
        border: '1px solid rgba(251,191,36,0.3)',
      }}>
        {VIEWS.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              background: activeView === view.id
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                : 'rgba(255,255,255,0.05)',
              color: activeView === view.id ? '#0a0f1a' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        textAlign: 'right',
      }}>
        <div style={{
          fontSize: '12px',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Immersive Learning
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: 700,
          background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          DEFENSE ENTERPRISE 3D
        </div>
      </div>
    </div>
  )
}
