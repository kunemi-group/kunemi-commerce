import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../common/types/auth-user';
import { User } from '../database/entities/user.entity';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list(user: AuthUser) {
    const members = await this.users.find({
      where: { businessId: user.businessId },
      order: { createdAt: 'ASC' },
    });
    return {
      members: members.map((m) => ({
        id: m.id,
        email: m.email,
        fullName: m.fullName,
        role: m.role,
        createdAt: m.createdAt,
      })),
    };
  }
}
