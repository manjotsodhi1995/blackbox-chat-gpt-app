import { NextResponse } from 'next/server'

/**
 * OpenID Connect Discovery Document
 * Points to the OAuth server (blackbox-v0cc) for OpenAI Apps SDK Auth
 */
export async function GET() {
  // Get the OAuth server URL (blackbox-v0cc)
  const oauthServerUrl = process.env.NEXT_PUBLIC_BLACKBOX_APP_URL || 
                         process.env.BLACKBOX_APP_URL || 
                         'http://localhost:3001'

  return NextResponse.json({
    issuer: oauthServerUrl,
    authorization_endpoint: `${oauthServerUrl}/oauth/authorize`,
    token_endpoint: `${oauthServerUrl}/oauth/token`,
    registration_endpoint: `${oauthServerUrl}/oauth/register`,
    jwks_uri: `${oauthServerUrl}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['none'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
  })
}

