import React, { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import type { AuthClient, AuthSnapshot } from '../../auth/client'

void React // Keep source-package JSX compatible with consumers using the classic runtime.

type AuthContextValue = { client: AuthClient; snapshot: AuthSnapshot }
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ client, children }: { client: AuthClient; children: ReactNode }) {
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot)
  useEffect(() => { void client.initialize() }, [client])
  return <AuthContext.Provider value={{ client, snapshot }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

export function useSession() {
  const { snapshot } = useAuth()
  return {
    session: snapshot.session,
    user: snapshot.session?.user ?? null,
    status: snapshot.status,
    task: snapshot.task,
    isLoaded: snapshot.status !== 'loading',
    isSignedIn: snapshot.status === 'signed_in',
  }
}
