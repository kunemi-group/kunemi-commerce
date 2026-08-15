import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TeamService } from './team.service';

describe('TeamService', () => {
  const users = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const businesses = { findOne: jest.fn() };
  const mailService = { sendTeamMemberInvitation: jest.fn() };
  const owner = {
    sub: 'owner-1',
    businessId: 'business-1',
    role: 'owner' as const,
    email: 'owner@example.com',
  };
  const teamMember = {
    sub: 'team-1',
    businessId: 'business-1',
    role: 'team' as const,
    email: 'team@example.com',
  };

  let service: TeamService;

  beforeEach(() => {
    jest.clearAllMocks();
    users.save.mockImplementation(async (user) => user);
    service = new TeamService(
      users as never,
      businesses as never,
      mailService as never,
    );
  });

  it('lists members and seat usage within the actor business', async () => {
    users.find.mockResolvedValue([
      {
        id: 'owner-1',
        email: 'owner@example.com',
        fullName: 'Owner',
        role: 'owner',
      },
    ]);
    businesses.findOne.mockResolvedValue({ subscriptionTier: 'starter' });

    await expect(service.list(owner)).resolves.toEqual(
      expect.objectContaining({ seats: 2, used: 1, tier: 'starter' }),
    );
  });

  it('rejects team management by non-owners', async () => {
    await expect(
      service.invite(
        { email: 'new@example.com', fullName: 'New User', role: 'team' },
        teamMember,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('enforces seat limits before creating an invite', async () => {
    businesses.findOne.mockResolvedValue({
      subscriptionTier: 'starter',
      name: 'Store',
    });
    users.count.mockResolvedValue(2);

    await expect(
      service.invite(
        { email: 'new@example.com', fullName: 'New User', role: 'team' },
        owner,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a tenant-scoped Team invite with a password hash', async () => {
    businesses.findOne.mockResolvedValue({
      subscriptionTier: 'starter',
      name: 'Store',
    });
    users.count.mockResolvedValue(1);
    users.findOne.mockResolvedValue(null);
    const member = {
      id: 'member-1',
      businessId: 'business-1',
      email: 'new@example.com',
      fullName: 'New User',
      role: 'team',
      passwordHash: '',
    };
    users.create.mockImplementation((input) => ({ ...member, ...input }));

    const result = await service.invite(
      {
        email: ' NEW@EXAMPLE.COM ',
        fullName: ' New User ',
        role: 'team',
        password: 'Temporary123!',
      },
      owner,
    );

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        email: 'new@example.com',
        role: 'team',
        mustChangePassword: true,
        isEmailVerified: true,
      }),
    );
    const created = users.create.mock.calls[0][0];
    await expect(
      bcrypt.compare('Temporary123!', created.passwordHash),
    ).resolves.toBe(true);
    expect(result.member).not.toHaveProperty('passwordHash');
    expect(mailService.sendTeamMemberInvitation).toHaveBeenCalledWith(
      'new@example.com',
      'New User',
      'owner@example.com',
      'Temporary123!',
      'team',
      'Store',
    );
  });

  it('rejects globally duplicate member emails', async () => {
    businesses.findOne.mockResolvedValue({
      subscriptionTier: 'starter',
      name: 'Store',
    });
    users.count.mockResolvedValue(0);
    users.findOne.mockResolvedValue({ id: 'existing' });

    await expect(
      service.invite(
        { email: 'existing@example.com', fullName: 'Existing', role: 'team' },
        owner,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('protects the last owner from demotion and removal', async () => {
    const member = {
      id: 'owner-2',
      businessId: 'business-1',
      role: 'owner',
      email: 'other@example.com',
    };
    users.findOne.mockResolvedValue(member);
    users.count.mockResolvedValue(1);

    await expect(
      service.updateRole('owner-2', { role: 'team' }, owner),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.remove('owner-2', owner)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires the member to belong to the actor business', async () => {
    users.findOne.mockResolvedValue(null);

    await expect(
      service.updateRole('member-from-business-2', { role: 'team' }, owner),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
