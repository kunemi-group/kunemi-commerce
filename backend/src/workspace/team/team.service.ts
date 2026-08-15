import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import type { AuthUser } from '../../common/types/auth-user';
import { Business } from '../../database/entities/business.entity';
import { User, type UserRole } from '../../database/entities/user.entity';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/team.dto';

import { MailService } from '../../shared/mail/mail.service';

const TIER_SEATS: Record<string, number> = {
  starter: 2,
  growth: 5,
  scale: 20,
};

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    private readonly mailService: MailService,
  ) {}

  async list(user: AuthUser) {
    const members = await this.users.find({
      where: { businessId: user.businessId },
      order: { createdAt: 'ASC' },
    });
    const business = await this.businesses.findOne({
      where: { id: user.businessId },
    });
    const seats = TIER_SEATS[business?.subscriptionTier ?? 'starter'] ?? 2;
    return {
      seats,
      used: members.length,
      tier: business?.subscriptionTier ?? 'starter',
      members: members.map((m) => this.toMember(m)),
    };
  }

  async invite(dto: InviteMemberDto, actor: AuthUser) {
    this.assertCanManageTeam(actor);

    const business = await this.businesses.findOne({
      where: { id: actor.businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const seats = TIER_SEATS[business.subscriptionTier] ?? 2;
    const used = await this.users.count({
      where: { businessId: actor.businessId },
    });
    if (used >= seats) {
      throw new BadRequestException(
        `Team seat limit reached (${used}/${seats} on ${business.subscriptionTier}). Upgrade plan to invite more.`,
      );
    }

    const email = dto.email.toLowerCase().trim();
    // Login is by email globally — must be unique across tenants
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const temporaryPassword =
      dto.password?.trim() || this.generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Product: Team only (stored as sales for legacy schema compatibility)
    const member = this.users.create({
      businessId: actor.businessId,
      email,
      fullName: dto.fullName.trim(),
      role: 'sales',
      passwordHash,
    });
    await this.users.save(member);

    void this.mailService.sendTeamMemberInvitation(
      email,
      member.fullName,
      actor.email,
      temporaryPassword,
      'team',
      business.name,
    );

    return {
      member: this.toMember(member),
      temporaryPassword,
      message:
        'Share the temporary password securely. An invitation email has also been sent.',
    };
  }

  async updateRole(
    memberId: string,
    dto: UpdateMemberRoleDto,
    actor: AuthUser,
  ) {
    this.assertCanManageTeam(actor);

    const member = await this.findMember(memberId, actor.businessId);

    if (member.id === actor.sub && dto.role !== member.role) {
      throw new BadRequestException('You cannot change your own role');
    }

    if (member.role === 'owner' && dto.role !== 'owner') {
      const owners = await this.users.count({
        where: { businessId: actor.businessId, role: 'owner' },
      });
      if (owners <= 1) {
        throw new BadRequestException(
          'Cannot demote the last owner. Promote another owner first.',
        );
      }
    }

    member.role = dto.role as UserRole;
    await this.users.save(member);
    return this.toMember(member);
  }

  async remove(memberId: string, actor: AuthUser) {
    this.assertCanManageTeam(actor);

    const member = await this.findMember(memberId, actor.businessId);

    if (member.id === actor.sub) {
      throw new BadRequestException('You cannot remove yourself');
    }

    if (member.role === 'owner') {
      const owners = await this.users.count({
        where: { businessId: actor.businessId, role: 'owner' },
      });
      if (owners <= 1) {
        throw new BadRequestException('Cannot remove the last owner');
      }
    }

    await this.users.remove(member);
    return { ok: true, id: memberId };
  }

  /** Product surface: only owners manage team seats and roles. */
  private assertCanManageTeam(actor: AuthUser) {
    if (actor.role !== 'owner') {
      throw new ForbiddenException('Only the owner can manage the team');
    }
  }

  private async findMember(id: string, businessId: string) {
    const member = await this.users.findOne({
      where: { id, businessId },
    });
    if (!member) throw new NotFoundException('Team member not found');
    return member;
  }

  private generateTempPassword() {
    // 12-char readable temp password
    return randomBytes(9).toString('base64url').slice(0, 12);
  }

  private toMember(m: User) {
    return {
      id: m.id,
      email: m.email,
      fullName: m.fullName,
      role: m.role,
      createdAt: m.createdAt,
    };
  }
}
