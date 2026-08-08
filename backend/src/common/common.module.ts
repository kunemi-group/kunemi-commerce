import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantProvisionerService } from './services/tenant-provisioner.service';
import { EdgeProxyGuard } from './guards/edge-proxy.guard';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TenantProvisionerService, EdgeProxyGuard],
  exports: [TenantProvisionerService, EdgeProxyGuard],
})
export class CommonModule {}
