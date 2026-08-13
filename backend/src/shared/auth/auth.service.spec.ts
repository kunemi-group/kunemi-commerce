import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const users = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const businesses = {};
  const jwt = { sign: jest.fn(), verify: jest.fn() };
  const storage = {};
  const tenantProvisioner = { registerTenant: jest.fn() };
  const mailService = { sendRegistrationVerification: jest.fn() };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.sign.mockImplementation((_payload: unknown, options?: { expiresIn?: string }) =>
      options?.expiresIn === '7d' ? 'refresh-token' : 'access-token',
    );
    users.save.mockImplementation(async (user) => user);
    service = new AuthService(
      users as never,
      businesses as never,
      jwt as never,
      storage as never,
      tenantProvisioner as never,
      mailService as never,
    );
  });

  it('normalizes login email and returns tokens while hashing the refresh token', async () => {
    const user = {
      id: 'user-1',
      businessId: 'business-1',
      email: 'owner@example.com',
      fullName: 'Owner',
      role: 'owner',
      passwordHash: await bcrypt.hash('correct-password', 10),
      isEmailVerified: true,
    };
    users.findOne.mockResolvedValue(user);

    const result = await service.login({
      email: ' OWNER@EXAMPLE.COM ',
      password: 'correct-password',
    });

    expect(users.findOne).toHaveBeenCalledWith({
      where: { email: 'owner@example.com' },
    });
    expect(result).toEqual(expect.objectContaining({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: expect.objectContaining({ id: 'user-1', role: 'owner' }),
    }));
    expect(user.refreshTokenHash).not.toBe('refresh-token');
    await expect(bcrypt.compare('refresh-token', user.refreshTokenHash)).resolves.toBe(true);
    expect(user.refreshTokenExpiresAt).toEqual(expect.any(Date));
  });

  it('rejects missing users and incorrect passwords uniformly', async () => {
    users.findOne.mockResolvedValueOnce(null);
    await expect(
      service.login({ email: 'missing@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    users.findOne.mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: await bcrypt.hash('correct-password', 10),
    });
    await expect(
      service.login({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('enforces the intended role boundary for ShopFlow users', async () => {
    const user = {
      id: 'staff-1',
      businessId: 'business-1',
      email: 'staff@example.com',
      fullName: 'Staff',
      role: 'owner',
      passwordHash: await bcrypt.hash('password', 10),
      isEmailVerified: true,
    };
    users.findOne.mockResolvedValue(user);

    await expect(
      service.userLogin({ email: user.email, password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects refresh tokens with the wrong token type', async () => {
    jwt.verify.mockReturnValue({ sub: 'user-1', tokenType: 'access' });

    await expect(service.refreshToken('access-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('revokes the stored refresh session during logout', async () => {
    const user = {
      id: 'user-1',
      refreshTokenHash: 'hash',
      refreshTokenExpiresAt: new Date(),
    };
    users.findOne.mockResolvedValue(user);

    await expect(service.logout('user-1')).resolves.toEqual({
      message: 'Logged out successfully',
    });
    expect(user.refreshTokenHash).toBeNull();
    expect(user.refreshTokenExpiresAt).toBeNull();
    expect(users.save).toHaveBeenCalledWith(user);
  });
});
