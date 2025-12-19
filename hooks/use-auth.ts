'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUser, clearAuthToken, revokeToken, getOAuthUrl, getAuthToken } from '@/lib/auth'
import type { User } from '@/types/auth'

export interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Custom hook for authentication
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const userData = await getUser()
      setUser(userData)
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(async () => {
    const currentUrl = window.location.href
    const { url } = await getOAuthUrl(currentUrl)
    window.location.href = url
  }, [])

  const logout = useCallback(async () => {
    const token = getAuthToken()
    if (token) {
      await revokeToken(token)
    }
    clearAuthToken()
    setUser(null)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refresh: loadUser,
  }
}

