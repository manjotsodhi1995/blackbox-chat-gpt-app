import { NextResponse } from 'next/server'

/**
 * OAuth Protected Resource Metadata
 * Points to the OAuth server (blackbox-v0cc) for OpenAI Apps SDK Auth
 */
export async function GET() {
  // Get the OAuth server URL (blackbox-v0cc)
  const oauthServerUrl = process.env.NEXT_PUBLIC_BLACKBOX_APP_URL || 
                         process.env.BLACKBOX_APP_URL || 
                         'http://localhost:3001'

  return NextResponse.json({
    authorization_servers: [
      {
        issuer: oauthServerUrl,
        authorization_endpoint: `${oauthServerUrl}/oauth/authorize`,
        token_endpoint: `${oauthServerUrl}/oauth/token`,
        registration_endpoint: `${oauthServerUrl}/oauth/register`,
        jwks_uri: `${oauthServerUrl}/.well-known/jwks.json`,
      },
    ],
    scopes_supported: ['openid', 'profile', 'email'],
    bearer_methods_supported: ['header'],
  })
}

