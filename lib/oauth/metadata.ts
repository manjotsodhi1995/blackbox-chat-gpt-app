import { NextResponse } from 'next/server';
import { baseURL } from '@/baseUrl';
import { getBetterAuthUrl } from '@/lib/auth/get-auth-url';

/**
 * Centralized OAuth metadata generation
 * Avoids duplication across multiple discovery endpoints
 */

export interface OAuthServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported: string[];
  scopes_supported: string[];
  mcp_oauth_required: boolean;
  mcp_auth_endpoint: string;
  mcp_server: string;
}

export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  mcp_oauth_required: boolean;
  mcp_auth_endpoint: string;
}

export interface OpenIDConfiguration extends OAuthServerMetadata {
  userinfo_endpoint: string;
  jwks_uri: string;
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
}

export interface MCPServerInfo {
  name: string;
  version: string;
  description: string;
  mcpVersion: string;
  capabilities: {
    tools: boolean;
    prompts: boolean;
    resources: boolean;
  };
  oauth: {
    required: boolean;
    authorizationServerMetadataUrl: string;
    protectedResourceMetadataUrl: string;
  };
  server: string;
}

/**
 * Generate OAuth 2.0 Authorization Server Metadata
 */
export function generateOAuthServerMetadata(mcpServerPath: string = '/mcp'): OAuthServerMetadata {
  const authUrl = getBetterAuthUrl();
  
  return {
    issuer: baseURL,
    authorization_endpoint: baseURL,
    token_endpoint: `${authUrl}/api/auth/token`,
    registration_endpoint: `${baseURL}/api/auth/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['openid', 'profile', 'email'],
    mcp_oauth_required: true,
    mcp_auth_endpoint: `${baseURL}?mcp_auth_required=true`,
    mcp_server: `${baseURL}${mcpServerPath}`,
  };
}

/**
 * Generate OAuth Protected Resource Metadata
 */
export function generateProtectedResourceMetadata(
  mcpServerPath: string = '/mcp',
  authServerPath: string = '/.well-known/oauth-authorization-server'
): ProtectedResourceMetadata {
  return {
    resource: `${baseURL}${mcpServerPath}`,
    authorization_servers: [`${baseURL}${authServerPath}`],
    mcp_oauth_required: true,
    mcp_auth_endpoint: `${baseURL}?mcp_auth_required=true`,
  };
}

/**
 * Generate OpenID Connect Configuration
 */
export function generateOpenIDConfiguration(mcpServerPath: string = '/mcp'): OpenIDConfiguration {
  const authUrl = getBetterAuthUrl();
  const baseMetadata = generateOAuthServerMetadata(mcpServerPath);
  
  return {
    ...baseMetadata,
    userinfo_endpoint: `${authUrl}/api/auth/userinfo`,
    jwks_uri: `${authUrl}/api/auth/jwks`,
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    claims_supported: ['sub', 'name', 'email', 'email_verified', 'picture'],
  };
}

/**
 * Generate MCP Server Info
 */
export function generateMCPServerInfo(
  mcpServerPath: string = '/mcp',
  discoveryBasePath?: string
): MCPServerInfo {
  const basePath = discoveryBasePath || `${mcpServerPath}/.well-known`;
  
  return {
    name: 'blackbox-mcp-server',
    version: '1.0.0',
    description: 'Blackbox MCP server with OAuth authentication',
    mcpVersion: '2024-11-05',
    capabilities: {
      tools: true,
      prompts: false,
      resources: false,
    },
    oauth: {
      required: true,
      authorizationServerMetadataUrl: `${baseURL}${basePath}/oauth-authorization-server`,
      protectedResourceMetadataUrl: `${baseURL}${basePath}/oauth-protected-resource`,
    },
    server: `${baseURL}${mcpServerPath}`,
  };
}

/**
 * Helper to create NextResponse with JSON
 */
export function jsonResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}
