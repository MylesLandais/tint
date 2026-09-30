import type { AnnotationImage } from './contracts'
import type { Point } from './geometry'

export function loadMask(canvas: HTMLCanvasElement, image: AnnotationImage, url: string | undefined): () => void {
  const context = canvas.getContext('2d')
  if (!context) return () => {}
  let active = true
  context.clearRect(0, 0, image.width, image.height)
  if (url) {
    const bitmap = new Image()
    bitmap.crossOrigin = 'anonymous'
    bitmap.onload = () => { if (active) context.drawImage(bitmap, 0, 0, image.width, image.height) }
    bitmap.src = url
  }
  return () => { active = false }
}

export function drawMaskStroke(canvas: HTMLCanvasElement, image: AnnotationImage, from: Point, to: Point, size: number, erase: boolean): void {
  const context = canvas.getContext('2d')
  if (!context) return
  context.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
  context.strokeStyle = 'white'
  context.lineWidth = size
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(from.x * image.width, from.y * image.height)
  context.lineTo(to.x * image.width, to.y * image.height)
  context.stroke()
}
