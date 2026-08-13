import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const businesses = { findOne: jest.fn(), save: jest.fn() };
  const users = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const orders = {};
  const payments = {};
  const tenantProvisioner = {};
  const mailService = { sendAdminUserCreated: jest.fn() };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(
      businesses as never,
      users as never,
      orders as never,
      payments as never,
      tenantProvisioner as never,
      mailService as never,
    );
  });

  it('creates a platform admin with a hash and never returns the password', async () => {
    users.findOne.mockResolvedValue(null);
    users.create.mockImplementation((input) => ({
      ...input,
      id: 'admin-1',
      createdAt: new Date('2026-01-01'),
    }));
    users.save.mockImplementation(async (user) => user);

    const result = await service.createPlatformAdmin({
      email: ' ADMIN@EXAMPLE.COM ',
      fullName: ' Platform Admin ',
      password: 'a-strong-password',
      role: 'admin',
    });

    expect(result).toEqual({
      id: 'admin-1',
      email: 'admin@example.com',
      fullName: 'Platform Admin',
      role: 'admin',
      createdAt: new Date('2026-01-01'),
    });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passwordHash');

    const savedUser = users.create.mock.calls[0][0];
    expect(savedUser.passwordHash).not.toBe('a-strong-password');
    await expect(bcrypt.compare('a-strong-password', savedUser.passwordHash)).resolves.toBe(true);
    expect(mailService.sendAdminUserCreated).toHaveBeenCalledWith(
      'admin@example.com',
      'Platform Admin',
      'a-strong-password',
      'admin',
    );
  });

  it('rejects duplicate platform admin emails', async () => {
    users.findOne.mockResolvedValue({ id: 'existing' });

    await expect(
      service.createPlatformAdmin({
        email: 'admin@example.com',
        fullName: 'Admin',
        password: 'a-strong-password',
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('rejects deletion when the user does not exist', async () => {
    users.findOne.mockResolvedValue(null);

    await expect(service.deletePlatformAdmin('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
