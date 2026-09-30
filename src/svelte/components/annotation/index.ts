export { default as AnnotationCanvas } from './AnnotationCanvas.svelte'
export type { AnnotationRegion, AnnotationTool, RegionGeometry, AnnotationImage,
  Point, VectorGeometry, TrackKeyframe } from '../../../core/annotation'
export { interpolateGeometry, splitTrack, joinTracks } from '../../../core/annotation'
