import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import type { QueryRunner } from 'typeorm';

export type TenantDatabaseContext = {
  queryRunner: QueryRunner;
  businessId: string;
  userId: string;
  isPlatformAdmin: boolean;
  isPublic: boolean;
};

@Injectable()
export class TenantDatabaseContextService {
  private readonly storage = new AsyncLocalStorage<TenantDatabaseContext>();

  get current(): TenantDatabaseContext | undefined {
    return this.storage.getStore();
  }

  run<T>(context: TenantDatabaseContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }
}
