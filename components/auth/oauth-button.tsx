'use client'

import { useAuth } from '@/hooks/use-auth'

interface OAuthButtonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Button that redirects to OAuth authorization page
 * Shows "Sign In" or user email if authenticated
 */
export function OAuthButton({ className, children }: OAuthButtonProps) {
  const { user, isAuthenticated, login } = useAuth()

  if (isAuthenticated && user) {
    return (
      <div className={className}>
        <span className="text-sm text-muted-foreground">
          {user.email}
        </span>
      </div>
    )
  }

  return (
    <button onClick={login} className={className}>
      {children || 'Sign In'}
    </button>
  )
}

