/**
 * Authentication Types for ChatGPT App
 */

export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface TokenValidationResponse {
  valid: boolean
  user?: User
  error?: string
}

