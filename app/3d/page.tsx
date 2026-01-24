'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import to avoid SSR issues with Three.js
const DefenseEnterprise3D = dynamic(
  () => import('@/components/DefenseEnterprise3D'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100%',
        height: '100vh',
        background: '#0a0f1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fbbf24',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(251,191,36,0.2)',
          borderTopColor: '#fbbf24',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1.5rem',
        }} />
        <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Loading 3D Environment
        </div>
        <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Initializing WebGL renderer...
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    ),
  }
)

export default function Defense3DPage() {
  return (
    <>
      {/* Back navigation overlay */}
      <Link
        href="/"
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '8px',
          color: '#fbbf24',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
        }}
      >
        <span>←</span> Back to Home
      </Link>

      <DefenseEnterprise3D />
    </>
  )
}
