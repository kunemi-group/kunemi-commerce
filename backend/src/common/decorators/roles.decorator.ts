import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../database/entities/user.entity';

export const ROLES_KEY = 'roles';

/** Require one of these JWT roles (owner/manager/sales/ops). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
