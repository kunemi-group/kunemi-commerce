import { ForbiddenException } from '@nestjs/common';
import { CsrfOriginGuard } from './csrf-origin.guard';

function executionContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

describe('CsrfOriginGuard', () => {
  const config = { get: jest.fn() };

  beforeEach(() => {
    config.get.mockReturnValue('https://workspace.example.com, https://admin.example.com');
  });

  it('allows safe requests without an origin', () => {
    const guard = new CsrfOriginGuard(config as never);

    expect(guard.canActivate(executionContext({ method: 'GET', headers: {} }))).toBe(true);
  });

  it('allows bearer-only state changes without CSRF origin checks', () => {
    const guard = new CsrfOriginGuard(config as never);

    expect(
      guard.canActivate(
        executionContext({
          method: 'POST',
          headers: { authorization: 'Bearer token' },
        }),
      ),
    ).toBe(true);
  });

  it('rejects cookie-authenticated state changes from an unknown origin', () => {
    const guard = new CsrfOriginGuard(config as never);

    expect(() =>
      guard.canActivate(
        executionContext({
          method: 'PATCH',
          headers: {
            cookie: 'kunemi_workspace_token=token',
            origin: 'https://attacker.example.com',
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows cookie-authenticated state changes from an explicit origin', () => {
    const guard = new CsrfOriginGuard(config as never);

    expect(
      guard.canActivate(
        executionContext({
          method: 'POST',
          headers: {
            cookie: 'kunemi_workspace_refresh_token=token',
            origin: 'https://workspace.example.com',
          },
        }),
      ),
    ).toBe(true);
  });
});
