import type { Request, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'kunemi_workspace_token';
export const REFRESH_TOKEN_COOKIE = 'kunemi_workspace_refresh_token';

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.cookie;
  if (!header) return null;

  for (const entry of header.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0) continue;
    const key = entry.slice(0, separator).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(entry.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function accessTokenFromRequest(request: Request): string | null {
  return cookieValue(request, ACCESS_TOKEN_COOKIE);
}

export function refreshTokenFromRequest(request: Request): string | null {
  return cookieValue(request, REFRESH_TOKEN_COOKIE);
}

export function setSessionCookies(response: Response, tokens: SessionTokens) {
  const secure = process.env.NODE_ENV === 'production';
  const shared = {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...shared,
    maxAge: 15 * 60 * 1000,
  });
  response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...shared,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookies(response: Response) {
  const secure = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  };
  response.clearCookie(ACCESS_TOKEN_COOKIE, options);
  response.clearCookie(REFRESH_TOKEN_COOKIE, options);
}
