'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { GlitchText } from '@/components/AnimatedText'

// Dynamically import the video player to avoid SSR issues
const VideoBackground = dynamic(() => import('@/components/VideoBackground'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950" />
  ),
})

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const heroOpacity = Math.max(0, 1 - scrollY / 500)
  const heroScale = 1 + scrollY / 2000

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Video Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Remotion Player Background */}
        <VideoBackground opacity={heroOpacity} scale={heroScale} />

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />

        {/* Vignette */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Scanlines (subtle) */}
        <div
          className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center">
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm"
          >
            <span className="text-indigo-400 text-sm font-medium tracking-wide uppercase">
              DoD Leadership Training Platform
            </span>
          </motion.div>

          {/* Main Title with Glitch Effect */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, type: 'spring' }}
            className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight"
          >
            <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              {mounted ? <GlitchText text="Face Cards" /> : 'Face Cards'}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
          >
            Master the faces, names, and authorities of{' '}
            <span className="text-indigo-400 font-semibold">70+ defense leaders</span>.
            Interactive flashcards meet dynamic visualizations.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link
              href="/study"
              className="group relative px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl overflow-hidden transition-all hover:bg-indigo-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25"
            >
              <span className="relative z-10">Start Studying</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/authorities"
              className="px-8 py-4 border-2 border-slate-700 text-slate-300 font-bold rounded-xl transition-all hover:border-indigo-500 hover:text-white hover:scale-105"
            >
              Explore Authorities
            </Link>

            <Link
              href="/3d"
              className="px-8 py-4 border-2 border-amber-500/50 text-amber-400 font-bold rounded-xl transition-all hover:border-amber-400 hover:text-amber-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20"
            >
              3D Enterprise View
            </Link>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
          >
            <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-1">
              <div className="w-1.5 h-3 bg-slate-500 rounded-full animate-pulse" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-white text-center mb-16"
          >
            Why Face Cards?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Study Smarter</h3>
              <p className="text-slate-400 leading-relaxed">
                Spaced repetition flashcards with photo recognition. Filter by branch, category, or organization.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Visualize Authority</h3>
              <p className="text-slate-400 leading-relaxed">
                See how domains overlap. Matrix views, domain clusters, and bridge analysis reveal hidden connections.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all hover:-translate-y-2"
            >
              <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Always Current</h3>
              <p className="text-slate-400 leading-relaxed">
                Official photos and bios sourced from war.gov. Stay up to date with the latest appointments.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-950 to-indigo-950/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">70+</div>
              <div className="text-slate-400">Officials</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-indigo-400 mb-2">10</div>
              <div className="text-slate-400">Domains</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-purple-400 mb-2">5</div>
              <div className="text-slate-400">View Modes</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-cyan-400 mb-2">24/7</div>
              <div className="text-slate-400">Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              know your leadership
            </span>
            ?
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Start with the flashcards. Explore the visualizations. Master the chain of command.
          </p>
          <Link
            href="/study"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25"
          >
            Launch App
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm">
            Face Cards - DoD Leadership Training
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="text-slate-400 hover:text-white transition-colors text-sm">
              About
            </Link>
            <Link href="/study" className="text-slate-400 hover:text-white transition-colors text-sm">
              Study
            </Link>
            <Link href="/authorities" className="text-slate-400 hover:text-white transition-colors text-sm">
              Authorities
            </Link>
            <Link href="/3d" className="text-amber-400 hover:text-amber-300 transition-colors text-sm">
              3D View
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
