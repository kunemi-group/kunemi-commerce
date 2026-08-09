import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantProvisionerService } from './services/tenant-provisioner.service';
import { TenantDatabaseContextService } from './services/tenant-database-context.service';
import { EdgeProxyGuard } from './guards/edge-proxy.guard';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TenantProvisionerService, TenantDatabaseContextService, EdgeProxyGuard],
  exports: [TenantProvisionerService, TenantDatabaseContextService, EdgeProxyGuard],
})
export class CommonModule {}
