import type { VectorGeometry } from './geometry'

export type RegionGeometry = VectorGeometry | { kind: 'mask'; url: string }
export type AnnotationRegion = { id: string; label: string; geometry: RegionGeometry; tone?: 'proposal' | 'accepted' | 'draft'; hidden?: boolean }
export type AnnotationTool = 'select' | 'box' | 'polygon' | 'brush' | 'erase'
export type AnnotationImage = { id: string; url: string; width: number; height: number }
