'use client'

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion'
import { DOMAINS, LEVEL_COLORS, type Official, type DomainDef } from './types'

// Sample officials data (subset for the animation)
const OFFICIALS: Official[] = [
  { id: '1', name: 'Lloyd Austin', abbrev: 'SECDEF', title: 'Secretary of Defense', level: 'secretary', domains: ['policy', 'nuclear'] },
  { id: '2', name: 'Kathleen Hicks', abbrev: 'DEPSECDEF', title: 'Deputy Secretary of Defense', level: 'deputy', domains: ['policy', 'technology', 'acquisition'] },
  { id: '3', name: 'John Plumb', abbrev: 'ASD(SP)', title: 'ASD for Space Policy', level: 'assistant', domains: ['nuclear', 'policy', 'technology'] },
  { id: '4', name: 'Radha Iyengar Plumb', abbrev: 'DCIO', title: 'Deputy CIO', level: 'director', domains: ['technology'] },
  { id: '5', name: 'Heidi Shyu', abbrev: 'USD(R&E)', title: 'Under Secretary for Research & Engineering', level: 'under', domains: ['technology', 'acquisition'] },
  { id: '6', name: 'William LaPlante', abbrev: 'USD(A&S)', title: 'Under Secretary for Acquisition & Sustainment', level: 'under', domains: ['acquisition', 'technology'] },
  { id: '7', name: 'Colin Kahl', abbrev: 'USD(P)', title: 'Under Secretary for Policy', level: 'under', domains: ['policy', 'indo_pacific', 'europe', 'middle_east'] },
  { id: '8', name: 'Gilbert Cisneros', abbrev: 'USD(P&R)', title: 'Under Secretary for Personnel & Readiness', level: 'under', domains: ['personnel'] },
  { id: '9', name: 'Michael McCord', abbrev: 'USD(C)', title: 'Under Secretary Comptroller', level: 'under', domains: ['acquisition'] },
  { id: '10', name: 'Ronald Moultrie', abbrev: 'USD(I&S)', title: 'Under Secretary for Intelligence & Security', level: 'under', domains: ['intelligence', 'technology'] },
  { id: '11', name: 'Chris Maier', abbrev: 'ASD(SO/LIC)', title: 'ASD for Special Operations', level: 'assistant', domains: ['special_ops', 'intelligence'] },
  { id: '12', name: 'Ely Ratner', abbrev: 'ASD(IP)', title: 'ASD for Indo-Pacific Security', level: 'assistant', domains: ['indo_pacific', 'policy'] },
  { id: '13', name: 'Celeste Wallander', abbrev: 'ASD(ISA)', title: 'ASD for International Security Affairs', level: 'assistant', domains: ['europe', 'policy'] },
  { id: '14', name: 'Gen Mark Milley', abbrev: 'CJCS', title: 'Chairman, Joint Chiefs of Staff', level: 'chief', domains: ['policy', 'nuclear', 'indo_pacific', 'europe', 'middle_east'] },
  { id: '15', name: 'Adm John Aquilino', abbrev: 'CDRUSINDOPACOM', title: 'Commander, INDOPACOM', level: 'commander', domains: ['indo_pacific'] },
  { id: '16', name: 'Gen Michael Kurilla', abbrev: 'CDRUSCENTCOM', title: 'Commander, CENTCOM', level: 'commander', domains: ['middle_east', 'special_ops'] },
  { id: '17', name: 'Gen Christopher Cavoli', abbrev: 'CDRUSEUCOM', title: 'Commander, EUCOM', level: 'commander', domains: ['europe'] },
  { id: '18', name: 'Gen Anthony Cotton', abbrev: 'CDRUSSTRATCOM', title: 'Commander, STRATCOM', level: 'commander', domains: ['nuclear', 'intelligence'] },
  { id: '19', name: 'Gen Bryan Fenton', abbrev: 'CDRUSSOCOM', title: 'Commander, SOCOM', level: 'commander', domains: ['special_ops', 'intelligence'] },
  { id: '20', name: 'Lt Gen Scott Berrier', abbrev: 'DIR DIA', title: 'Director, DIA', level: 'director', domains: ['intelligence'] },
]

function getOfficialDomains(official: Official): string[] {
  return official.domains
}

// Calculate domain positions in a circle
function getDomainPositions(width: number, height: number): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.35

  DOMAINS.forEach((domain, index) => {
    const angle = (index / DOMAINS.length) * Math.PI * 2 - Math.PI / 2
    positions.set(domain.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    })
  })

  return positions
}

// Particle component for officials
function OfficialParticle({
  official,
  domainPositions,
  frame,
  fps,
}: {
  official: Official
  domainPositions: Map<string, { x: number; y: number }>
  frame: number
  fps: number
}) {
  const domains = getOfficialDomains(official)
  if (domains.length === 0) return null

  // Initial random position (seeded by id)
  const seed = parseInt(official.id) * 1337
  const initialX = 100 + (seed % 1000) / 1000 * 1720
  const initialY = 100 + ((seed * 7) % 1000) / 1000 * 880

  // Calculate target position (centroid of domains)
  let targetX = 0
  let targetY = 0
  domains.forEach(domainId => {
    const pos = domainPositions.get(domainId)
    if (pos) {
      targetX += pos.x
      targetY += pos.y
    }
  })
  targetX /= domains.length
  targetY /= domains.length

  // Animation phases
  const appearFrame = 30 + (parseInt(official.id) * 3)
  const moveStartFrame = 90
  const moveEndFrame = 180

  // Appear animation
  const opacity = interpolate(frame, [appearFrame, appearFrame + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Scale pulse on appear
  const scale = interpolate(frame, [appearFrame, appearFrame + 10, appearFrame + 20], [0, 1.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Move to target
  const moveProgress = spring({
    frame: frame - moveStartFrame,
    fps,
    config: {
      damping: 100,
      stiffness: 50,
      mass: 1 + domains.length * 0.5,
    },
  })

  const x = interpolate(moveProgress, [0, 1], [initialX, targetX])
  const y = interpolate(moveProgress, [0, 1], [initialY, targetY])

  // Glow intensity based on domain count
  const glowIntensity = 10 + domains.length * 5

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        width: 12 + domains.length * 4,
        height: 12 + domains.length * 4,
        borderRadius: '50%',
        background: LEVEL_COLORS[official.level],
        boxShadow: `0 0 ${glowIntensity}px ${LEVEL_COLORS[official.level]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 8,
        fontWeight: 700,
        color: '#000',
        zIndex: 10,
      }}
    >
      {domains.length > 2 && official.abbrev.slice(0, 2)}
    </div>
  )
}

// Domain node component
function DomainNode({
  domain,
  position,
  frame,
  officialCount,
}: {
  domain: DomainDef
  position: { x: number; y: number }
  frame: number
  officialCount: number
}) {
  const appearFrame = 60 + DOMAINS.indexOf(domain) * 5

  const opacity = interpolate(frame, [appearFrame, appearFrame + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const scale = interpolate(frame, [appearFrame, appearFrame + 20], [0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Pulse animation
  const pulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 2 + DOMAINS.indexOf(domain)),
    [-1, 1],
    [0.95, 1.05]
  )

  const size = 80 + officialCount * 10

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) scale(${scale * pulse})`,
        opacity,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${domain.color}40 0%, ${domain.color}10 70%, transparent 100%)`,
        border: `2px solid ${domain.color}60`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: domain.color,
          textAlign: 'center',
          textShadow: `0 0 10px ${domain.color}`,
          maxWidth: size - 10,
        }}
      >
        {domain.name.split(' ')[0]}
      </div>
    </div>
  )
}

// Connection line between bridging officials and domains
function ConnectionLine({
  from,
  to,
  color,
  frame,
  delay,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  color: string
  frame: number
  delay: number
}) {
  const progress = interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const opacity = interpolate(frame, [delay, delay + 20], [0, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const endX = interpolate(progress, [0, 1], [from.x, to.x])
  const endY = interpolate(progress, [0, 1], [from.y, to.y])

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
      <line
        x1={from.x}
        y1={from.y}
        x2={endX}
        y2={endY}
        stroke={color}
        strokeWidth={1.5}
        opacity={opacity}
        strokeLinecap="round"
      />
    </svg>
  )
}

// Title animation
function TitleOverlay({ frame }: { frame: number }) {
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const titleY = interpolate(frame, [0, 30], [-20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const subtitleOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Fade out for main animation
  const fadeOut = interpolate(frame, [80, 110], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 100,
        opacity: fadeOut,
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: '#fff',
          margin: 0,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textShadow: '0 0 40px rgba(99, 102, 241, 0.8)',
          letterSpacing: '-1px',
        }}
      >
        Authority Flows
      </h1>
      <p
        style={{
          fontSize: 18,
          color: '#94a3b8',
          margin: '10px 0 0 0',
          opacity: subtitleOpacity,
        }}
      >
        Visualizing DoD Leadership Domains
      </p>
    </div>
  )
}

// Stats overlay that appears at end
function StatsOverlay({ frame, fps }: { frame: number; fps: number }) {
  const appearFrame = 200

  const opacity = interpolate(frame, [appearFrame, appearFrame + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const multiDomainOfficials = OFFICIALS.filter(o => o.domains.length > 1).length
  const bridgingOfficials = OFFICIALS.filter(o => o.domains.length > 2).length

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 60,
        opacity,
        zIndex: 100,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#60a5fa' }}>{OFFICIALS.length}</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>Officials</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#a855f7' }}>{DOMAINS.length}</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>Domains</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#22c55e' }}>{multiDomainOfficials}</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>Multi-Domain</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#f59e0b' }}>{bridgingOfficials}</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>Bridging 3+</div>
      </div>
    </div>
  )
}

// Background grid
function BackgroundGrid({ frame }: { frame: number }) {
  const opacity = interpolate(frame, [0, 60], [0, 0.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity,
        backgroundImage: `
          linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        zIndex: 0,
      }}
    />
  )
}

// Main composition
export const AuthorityFlow: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  const domainPositions = getDomainPositions(width, height)

  // Calculate official counts per domain
  const domainCounts = new Map<string, number>()
  DOMAINS.forEach(d => domainCounts.set(d.id, 0))
  OFFICIALS.forEach(official => {
    official.domains.forEach(domainId => {
      domainCounts.set(domainId, (domainCounts.get(domainId) || 0) + 1)
    })
  })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      <BackgroundGrid frame={frame} />

      {/* Domain nodes */}
      {DOMAINS.map(domain => {
        const pos = domainPositions.get(domain.id)
        if (!pos) return null
        return (
          <DomainNode
            key={domain.id}
            domain={domain}
            position={pos}
            frame={frame}
            officialCount={domainCounts.get(domain.id) || 0}
          />
        )
      })}

      {/* Connection lines for multi-domain officials */}
      {frame > 180 && OFFICIALS.filter(o => o.domains.length > 1).map(official => {
        const domains = official.domains
        const seed = parseInt(official.id) * 1337

        // Calculate official position (centroid)
        let ox = 0, oy = 0
        domains.forEach(domainId => {
          const pos = domainPositions.get(domainId)
          if (pos) { ox += pos.x; oy += pos.y }
        })
        ox /= domains.length
        oy /= domains.length

        return domains.map((domainId, i) => {
          const domainPos = domainPositions.get(domainId)
          if (!domainPos) return null
          const domain = DOMAINS.find(d => d.id === domainId)

          return (
            <ConnectionLine
              key={`${official.id}-${domainId}`}
              from={{ x: ox, y: oy }}
              to={domainPos}
              color={domain?.color || '#fff'}
              frame={frame}
              delay={180 + parseInt(official.id) * 2}
            />
          )
        })
      })}

      {/* Official particles */}
      {OFFICIALS.map(official => (
        <OfficialParticle
          key={official.id}
          official={official}
          domainPositions={domainPositions}
          frame={frame}
          fps={fps}
        />
      ))}

      <TitleOverlay frame={frame} />
      <StatsOverlay frame={frame} fps={fps} />
    </AbsoluteFill>
  )
}

export default AuthorityFlow
