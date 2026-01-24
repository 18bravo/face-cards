'use client'

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { DOMAINS, LEVEL_COLORS } from './types'

// Floating particle that orbits domains
function FloatingParticle({
  id,
  frame,
  width,
  height,
}: {
  id: number
  frame: number
  width: number
  height: number
}) {
  const seed = id * 1337
  const orbitRadius = 150 + (seed % 300)
  const speed = 0.3 + (seed % 100) / 200
  const domainIndex = seed % DOMAINS.length
  const domain = DOMAINS[domainIndex]

  const centerX = width / 2
  const centerY = height / 2
  const domainRadius = Math.min(width, height) * 0.35
  const domainAngle = (domainIndex / DOMAINS.length) * Math.PI * 2 - Math.PI / 2
  const domainX = centerX + Math.cos(domainAngle) * domainRadius
  const domainY = centerY + Math.sin(domainAngle) * domainRadius

  // Orbit around the domain
  const orbitAngle = (frame * speed * 0.02) + (seed % 100) / 10
  const x = domainX + Math.cos(orbitAngle) * orbitRadius * 0.5
  const y = domainY + Math.sin(orbitAngle) * orbitRadius * 0.3

  // Pulse
  const pulse = interpolate(
    Math.sin(frame * 0.1 + id),
    [-1, 1],
    [0.6, 1]
  )

  const size = 4 + (seed % 8)
  const levels = Object.keys(LEVEL_COLORS)
  const level = levels[seed % levels.length]

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        borderRadius: '50%',
        background: LEVEL_COLORS[level],
        opacity: 0.6 * pulse,
        boxShadow: `0 0 ${size * 2}px ${LEVEL_COLORS[level]}80`,
        zIndex: 10,
      }}
    />
  )
}

// Domain orb with pulsing glow
function DomainOrb({
  domain,
  index,
  frame,
  width,
  height,
}: {
  domain: typeof DOMAINS[0]
  index: number
  frame: number
  width: number
  height: number
}) {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.35

  const angle = (index / DOMAINS.length) * Math.PI * 2 - Math.PI / 2
  const x = centerX + Math.cos(angle) * radius
  const y = centerY + Math.sin(angle) * radius

  // Breathing animation
  const breathe = interpolate(
    Math.sin((frame * 0.03) + index * 0.5),
    [-1, 1],
    [0.9, 1.1]
  )

  // Glow pulse
  const glowPulse = interpolate(
    Math.sin((frame * 0.05) + index),
    [-1, 1],
    [20, 40]
  )

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${breathe})`,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${domain.color}30 0%, ${domain.color}05 70%, transparent 100%)`,
        boxShadow: `0 0 ${glowPulse}px ${domain.color}40`,
        border: `1px solid ${domain.color}30`,
        zIndex: 5,
      }}
    />
  )
}

// Connection arc between domains
function ConnectionArc({
  from,
  to,
  frame,
  index,
  width,
  height,
}: {
  from: number
  to: number
  frame: number
  index: number
  width: number
  height: number
}) {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.35

  const angle1 = (from / DOMAINS.length) * Math.PI * 2 - Math.PI / 2
  const angle2 = (to / DOMAINS.length) * Math.PI * 2 - Math.PI / 2

  const x1 = centerX + Math.cos(angle1) * radius
  const y1 = centerY + Math.sin(angle1) * radius
  const x2 = centerX + Math.cos(angle2) * radius
  const y2 = centerY + Math.sin(angle2) * radius

  // Animate opacity in a wave
  const waveOffset = index * 0.3
  const opacity = interpolate(
    Math.sin((frame * 0.02) + waveOffset),
    [-1, 1],
    [0.02, 0.15]
  )

  // Control point for curve
  const midAngle = (angle1 + angle2) / 2
  const curveRadius = radius * 0.5
  const cx = centerX + Math.cos(midAngle) * curveRadius
  const cy = centerY + Math.sin(midAngle) * curveRadius

  const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`

  const color = DOMAINS[from].color

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={opacity}
        strokeLinecap="round"
      />
    </svg>
  )
}

// Central pulsing core
function CentralCore({ frame, width, height }: { frame: number; width: number; height: number }) {
  const pulse = interpolate(
    Math.sin(frame * 0.04),
    [-1, 1],
    [0.8, 1.2]
  )

  const glowSize = interpolate(
    Math.sin(frame * 0.04),
    [-1, 1],
    [100, 150]
  )

  return (
    <div
      style={{
        position: 'absolute',
        left: width / 2,
        top: height / 2,
        transform: `translate(-50%, -50%) scale(${pulse})`,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
        boxShadow: `0 0 ${glowSize}px rgba(99, 102, 241, 0.3)`,
        zIndex: 2,
      }}
    />
  )
}

// Animated grid background
function AnimatedGrid({ frame }: { frame: number }) {
  const offset = (frame * 0.5) % 50

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        backgroundImage: `
          linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        backgroundPosition: `${offset}px ${offset}px`,
        zIndex: 0,
      }}
    />
  )
}

// Main looping composition
export const HeroLoop: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  // Generate connection pairs
  const connections: { from: number; to: number }[] = []
  for (let i = 0; i < DOMAINS.length; i++) {
    for (let j = i + 2; j < DOMAINS.length; j += 2) {
      connections.push({ from: i, to: j })
    }
  }

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      <AnimatedGrid frame={frame} />

      {/* Connection arcs */}
      {connections.map((conn, i) => (
        <ConnectionArc
          key={`${conn.from}-${conn.to}`}
          from={conn.from}
          to={conn.to}
          frame={frame}
          index={i}
          width={width}
          height={height}
        />
      ))}

      <CentralCore frame={frame} width={width} height={height} />

      {/* Domain orbs */}
      {DOMAINS.map((domain, index) => (
        <DomainOrb
          key={domain.id}
          domain={domain}
          index={index}
          frame={frame}
          width={width}
          height={height}
        />
      ))}

      {/* Floating particles */}
      {Array.from({ length: 40 }, (_, i) => (
        <FloatingParticle
          key={i}
          id={i}
          frame={frame}
          width={width}
          height={height}
        />
      ))}
    </AbsoluteFill>
  )
}

export default HeroLoop
