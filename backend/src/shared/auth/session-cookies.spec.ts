import type { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenFromRequest,
  clearSessionCookies,
  refreshTokenFromRequest,
  setSessionCookies,
} from './session-cookies';

describe('session cookies', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('reads encoded access and refresh cookies', () => {
    const request = {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=access%20token; ${REFRESH_TOKEN_COOKIE}=refresh-token`,
      },
    } as never;

    expect(accessTokenFromRequest(request)).toBe('access token');
    expect(refreshTokenFromRequest(request)).toBe('refresh-token');
  });

  it('sets HttpOnly, SameSite, bounded session cookies', () => {
    process.env.NODE_ENV = 'production';
    const response = { cookie: jest.fn() } as unknown as Response;

    setSessionCookies(response, { accessToken: 'access', refreshToken: 'refresh' });

    expect(response.cookie).toHaveBeenNthCalledWith(
      1,
      ACCESS_TOKEN_COOKIE,
      'access',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900000 }),
    );
    expect(response.cookie).toHaveBeenNthCalledWith(
      2,
      REFRESH_TOKEN_COOKIE,
      'refresh',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax' }),
    );
  });

  it('clears both cookies with matching security attributes', () => {
    const response = { clearCookie: jest.fn() } as unknown as Response;

    clearSessionCookies(response);

    expect(response.clearCookie).toHaveBeenCalledTimes(2);
    expect(response.clearCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });
});
