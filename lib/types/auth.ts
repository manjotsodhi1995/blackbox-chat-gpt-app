export interface SessionData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
  email: string;
  name?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  authUrl?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  error?: string;
}

