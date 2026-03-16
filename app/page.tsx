import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950 relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="text-center max-w-2xl space-y-8 relative z-10">
        {/* Logo / Title */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-widest text-cyan-400 border border-cyan-400/30 rounded-full mb-4">
            Operational Simulation Platform
          </div>
          <h1 className="text-6xl font-bold tracking-tight">
            <span className="text-white">Ender</span>
            <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-md mx-auto">
            AI-powered global battle simulation using MiroFish swarm intelligence.
            Model full-scale military campaigns with thousands of autonomous agents.
          </p>
        </div>

        {/* Main actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/globe"
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold text-lg transition-colors tracking-wide"
          >
            Launch Globe
          </Link>
          <Link
            href="/simulation"
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded font-semibold text-lg transition-colors border border-gray-700 tracking-wide"
          >
            New Simulation
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
          <div className="hud-panel p-4 space-y-2">
            <div className="text-cyan-400 font-mono text-sm font-semibold">GLOBE VIEW</div>
            <p className="text-sm text-gray-400">
              CesiumJS 3D globe with real terrain, military unit placement, and theater-level operational visualization.
            </p>
          </div>
          <div className="hud-panel p-4 space-y-2">
            <div className="text-amber-400 font-mono text-sm font-semibold">MIROFISH ENGINE</div>
            <p className="text-sm text-gray-400">
              Swarm intelligence simulation with thousands of autonomous agents modeling force interactions and campaign outcomes.
            </p>
          </div>
          <div className="hud-panel p-4 space-y-2">
            <div className="text-green-400 font-mono text-sm font-semibold">NIST 800-53r5</div>
            <p className="text-sm text-gray-400">
              Security-hardened platform with comprehensive audit logging, RBAC, and encryption aligned to federal standards.
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 font-mono">
          EnderAI v0.1.0 &middot; MiroFish Integration &middot; CesiumJS Globe
        </p>
      </div>
    </main>
  )
}
