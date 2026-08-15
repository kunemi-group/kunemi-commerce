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
    sub: 'sales-1',
    businessId: 'business-1',
    role: 'sales' as const,
    email: 'sales@example.com',
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
    expect(users.find).toHaveBeenCalledWith({
      where: { businessId: 'business-1' },
      order: { createdAt: 'ASC' },
    });
    expect(businesses.findOne).toHaveBeenCalledWith({
      where: { id: 'business-1' },
    });
  });

  it('rejects team management by non-owners', async () => {
    await expect(
      service.invite(
        { email: 'new@example.com', fullName: 'New User', role: 'sales' },
        teamMember,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(businesses.findOne).not.toHaveBeenCalled();
  });

  it('rejects legacy manager role from managing the team', async () => {
    const manager = {
      sub: 'manager-1',
      businessId: 'business-1',
      role: 'manager' as const,
      email: 'manager@example.com',
    };
    await expect(
      service.invite(
        { email: 'new@example.com', fullName: 'New User', role: 'sales' },
        manager,
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
        { email: 'new@example.com', fullName: 'New User', role: 'sales' },
        owner,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.findOne).not.toHaveBeenCalled();
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
      role: 'sales',
      passwordHash: '',
    };
    users.create.mockImplementation((input) => ({ ...member, ...input }));

    const result = await service.invite(
      {
        email: ' NEW@EXAMPLE.COM ',
        fullName: ' New User ',
        role: 'sales',
        password: 'Temporary123!',
      },
      owner,
    );

    expect(users.findOne).toHaveBeenCalledWith({
      where: { email: 'new@example.com' },
    });
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        email: 'new@example.com',
        role: 'sales',
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
        { email: 'existing@example.com', fullName: 'Existing', role: 'sales' },
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
      service.updateRole('owner-2', { role: 'sales' }, owner),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.remove('owner-2', owner)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(users.remove).not.toHaveBeenCalled();
  });

  it('requires the member to belong to the actor business', async () => {
    users.findOne.mockResolvedValue(null);

    await expect(
      service.updateRole('member-from-business-2', { role: 'sales' }, owner),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(users.findOne).toHaveBeenCalledWith({
      where: { id: 'member-from-business-2', businessId: 'business-1' },
    });
  });
});
