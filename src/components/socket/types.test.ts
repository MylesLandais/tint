import { describe, expect, it } from 'vitest'
import type { Socket, SocketSpec, SocketType } from './types'

describe('socket type definitions', () => {
  it('accepts a concrete SocketType with optional wildcard and union', () => {
    const image = {
      name: 'IMAGE',
    } satisfies SocketType

    const anyType = {
      name: '*',
      wildcard: true,
    } satisfies SocketType

    const numberish = {
      name: 'FLOAT',
      union: ['INT', 'FLOAT'],
    } satisfies SocketType

    expect(image.name).toBe('IMAGE')
    expect(anyType.wildcard).toBe(true)
    expect(numberish.union).toEqual(['INT', 'FLOAT'])
  })

  it('accepts a SocketSpec with evaluation flags', () => {
    const spec = {
      type: { name: 'LATENT' },
      rawLink: true,
      lazy: true,
    } satisfies SocketSpec

    expect(spec.type.name).toBe('LATENT')
    expect(spec.rawLink).toBe(true)
    expect(spec.lazy).toBe(true)
  })

  it('accepts a Socket with list, tooltip, matchType, and extensions', () => {
    const socket = {
      dataType: { name: 'CONDITIONING' },
      isList: true,
      tooltip: 'Positive conditioning batch',
      matchType: 'CONDITIONING',
      extensions: { color: '#6cf' },
    } satisfies Socket

    expect(socket.isList).toBe(true)
    expect(socket.extensions.color).toBe('#6cf')
  })
})
