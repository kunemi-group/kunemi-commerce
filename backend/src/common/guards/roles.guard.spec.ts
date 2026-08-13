import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function context(request: Record<string, unknown>) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;

  beforeEach(() => jest.clearAllMocks());

  it('allows routes without role metadata', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);
    expect(new RolesGuard(reflector).canActivate(context({}))).toBe(true);
  });

  it('rejects a request without an authenticated role', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['owner']);
    expect(() => new RolesGuard(reflector).canActivate(context({}))).toThrow(ForbiddenException);
  });

  it('rejects roles outside the controller policy', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['owner', 'manager']);
    expect(() =>
      new RolesGuard(reflector).canActivate(context({ user: { role: 'sales' } })),
    ).toThrow(ForbiddenException);
  });

  it('allows a role explicitly listed by the route policy', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['owner', 'manager']);
    expect(
      new RolesGuard(reflector).canActivate(context({ user: { role: 'manager' } })),
    ).toBe(true);
  });
});
