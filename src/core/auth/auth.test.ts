import { describe, expect, it } from 'vitest'
import {
  createLastUsedStore, isKnownProvider, methodFromSession, providerName, resolveLastUsed, validateRegistration,
  type LastUsedStorage,
} from './index'

function memoryStorage(): LastUsedStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

const throwing: LastUsedStorage = {
  getItem: () => { throw new Error('blocked') },
  setItem: () => { throw new Error('blocked') },
  removeItem: () => { throw new Error('blocked') },
}

describe('auth providers', () => {
  it('knows the shipped providers and falls back to the id', () => {
    expect(isKnownProvider('github')).toBe(true)
    expect(isKnownProvider('toString')).toBe(false)
    expect(providerName('discord')).toBe('Discord')
    expect(providerName('gitlab')).toBe('gitlab')
  })
})

describe('last-used store', () => {
  it('remembers, reads and clears a method', () => {
    const storage = memoryStorage()
    const store = createLastUsedStore({ storage, key: 'k' })
    expect(store.read()).toBeNull()
    store.remember('github')
    expect(storage.data.get('k')).toBe('github')
    expect(store.read()).toBe('github')
    store.clear()
    expect(store.read()).toBeNull()
  })

  it('degrades to nothing remembered when storage throws or is absent', () => {
    const store = createLastUsedStore({ storage: throwing })
    expect(() => store.remember('google')).not.toThrow()
    expect(store.read()).toBeNull()
    expect(() => store.clear()).not.toThrow()
    expect(createLastUsedStore({ storage: null }).read()).toBeNull()
  })

  it('prefers the server hint and derives the method from a session', () => {
    expect(resolveLastUsed('google', 'github')).toBe('google')
    expect(resolveLastUsed(null, 'github')).toBe('github')
    expect(resolveLastUsed(undefined, null)).toBeNull()
    expect(methodFromSession({ authenticationMethods: ['discord', 'mfa'] })).toBe('discord')
    expect(methodFromSession({ authenticationMethods: [] })).toBeNull()
    expect(methodFromSession(null)).toBeNull()
  })
})

describe('registration validation', () => {
  it('returns error codes per field', () => {
    expect(validateRegistration({ email: '', password: '' })).toEqual({ email: 'required', password: 'required' })
    expect(validateRegistration({ email: 'ada@', password: 'short' })).toEqual({ email: 'invalid_email', password: 'password_too_short' })
    expect(validateRegistration({ email: ' ada@example.test ', password: 'long-enough' })).toEqual({})
  })

  it('applies the invite and password-length policy', () => {
    const input = { email: 'ada@example.test', password: 'abcd' }
    expect(validateRegistration(input, { minPasswordLength: 4 })).toEqual({})
    expect(validateRegistration(input, { minPasswordLength: 4, inviteRequired: true })).toEqual({ inviteCode: 'required' })
    expect(validateRegistration({ ...input, inviteCode: 'TINT' }, { minPasswordLength: 4, inviteRequired: true })).toEqual({})
  })
})
