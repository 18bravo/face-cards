// Shared types for Remotion compositions

export interface Official {
  id: string
  name: string
  abbrev: string
  title: string
  level: 'secretary' | 'deputy' | 'under' | 'assistant' | 'director' | 'chief' | 'commander'
  organization?: string
  x?: number
  y?: number
  targetX?: number
  targetY?: number
  domains: string[]
}

export interface DomainDef {
  id: string
  name: string
  color: string
  keywords: string[]
  x?: number
  y?: number
}

export const LEVEL_COLORS: Record<string, string> = {
  secretary: '#fbbf24',
  deputy: '#f97316',
  under: '#a855f7',
  assistant: '#3b82f6',
  director: '#10b981',
  chief: '#ef4444',
  commander: '#06b6d4',
}

export const DOMAINS: DomainDef[] = [
  { id: 'technology', name: 'Technology & R&D', color: '#8b5cf6', keywords: ['technology', 'S&T', 'research', 'development', 'engineering', 'science', 'innovation', 'R&D', 'digital', 'cyber', 'AI', 'software', 'CIO', 'CDAO', 'data'] },
  { id: 'special_ops', name: 'Special Operations', color: '#ef4444', keywords: ['special operations', 'SOF', 'SOCOM', 'special warfare'] },
  { id: 'intelligence', name: 'Intelligence', color: '#6366f1', keywords: ['intelligence', 'DIA', 'NSA', 'NGA', 'NRO', 'counterintelligence', 'surveillance', 'reconnaissance'] },
  { id: 'personnel', name: 'Personnel & Readiness', color: '#22c55e', keywords: ['personnel', 'manpower', 'readiness', 'reserve', 'family', 'health', 'military community', 'force management'] },
  { id: 'acquisition', name: 'Acquisition & Logistics', color: '#f59e0b', keywords: ['acquisition', 'procurement', 'logistics', 'sustainment', 'contracting', 'industrial', 'A&S'] },
  { id: 'policy', name: 'Policy & Strategy', color: '#ec4899', keywords: ['policy', 'strategy', 'plans', 'deterrence', 'arms control', 'treaties'] },
  { id: 'indo_pacific', name: 'Indo-Pacific', color: '#06b6d4', keywords: ['Indo-Pacific', 'INDOPACOM', 'Pacific', 'China', 'Korea', 'Japan', 'Australia'] },
  { id: 'europe', name: 'Europe & NATO', color: '#3b82f6', keywords: ['Europe', 'EUCOM', 'NATO', 'Russia', 'Arctic'] },
  { id: 'middle_east', name: 'Middle East', color: '#f97316', keywords: ['Middle East', 'CENTCOM', 'Central Command', 'Iran', 'Iraq', 'Syria', 'Gulf'] },
  { id: 'nuclear', name: 'Nuclear & Strategic', color: '#dc2626', keywords: ['nuclear', 'strategic', 'STRATCOM', 'missile defense', 'space', 'SPACECOM', 'deterrence'] },
]
