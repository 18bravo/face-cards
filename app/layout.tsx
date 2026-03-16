import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EnderAI — Global Battle Simulation Platform',
  description: 'AI-powered operational warning and battle simulation platform using MiroFish swarm intelligence for full-scale military campaign modeling.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
