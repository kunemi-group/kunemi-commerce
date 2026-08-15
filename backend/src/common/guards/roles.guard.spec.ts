import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function context(data: { user?: { role?: string } }) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => data,
    }),
  } as never;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  it('allows when no roles are required', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);
    expect(new RolesGuard(reflector as never).canActivate(context({}))).toBe(
      true,
    );
  });

  it('denies Team when Owner is required', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['owner']);
    expect(() =>
      new RolesGuard(reflector as never).canActivate(
        context({ user: { role: 'team' } }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows Owner when Owner is required', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['owner']);
    expect(
      new RolesGuard(reflector as never).canActivate(
        context({ user: { role: 'owner' } }),
      ),
    ).toBe(true);
  });

  it('allows Team when Owner or Team is required', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['owner', 'team']);
    expect(
      new RolesGuard(reflector as never).canActivate(
        context({ user: { role: 'team' } }),
      ),
    ).toBe(true);
  });
});
