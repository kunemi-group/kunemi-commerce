import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { BusinessesModule } from './businesses/businesses.module';
import { TeamModule } from './team/team.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { TrackingModule } from './tracking/tracking.module';
import { DocumentsModule } from './documents/documents.module';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import {
  Business,
  User,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  OrderStatusHistory,
  Delivery,
  DeliveryStatusEvent,
  Payment,
  Quotation,
  QuotationItem,
  Invoice,
  InvoiceItem,
} from './database/entities';
import { Public } from './common/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';

@Controller()
class RootController {
  @Public()
  @Get()
  root() {
    return {
      service: 'kunemi-workspace-api',
      docs: '/api/health',
      auth: ['POST /api/auth/register', 'POST /api/auth/login'],
      payments: [
        'GET /api/pay/:token',
        'POST /api/pay/:token/claim',
        'GET /api/payments',
        'PATCH /api/payments/:id/verify',
      ],
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const entities = [
          Business,
          User,
          Product,
          ProductVariant,
          Order,
          OrderItem,
          OrderStatusHistory,
          Delivery,
          DeliveryStatusEvent,
          Payment,
          Quotation,
          QuotationItem,
          Invoice,
          InvoiceItem,
        ];
        const logging = config.get<string>('TYPEORM_LOGGING') === 'true';
        // Prefer Postgres in prod; better-sqlite3 for local dev without Docker
        const dbType = config.get<string>('DATABASE_TYPE', 'postgres');
        if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
          return {
            type: 'better-sqlite3',
            database: config.get<string>('SQLITE_PATH', 'shopflow.dev.sqlite'),
            entities,
            synchronize: true,
            logging,
          };
        }
        return {
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: Number(config.get<string>('DATABASE_PORT', '5432')),
          username: config.get<string>('DATABASE_USER', 'Kunemi Workspace'),
          password: config.get<string>('DATABASE_PASSWORD', 'Kunemi Workspace'),
          database: config.get<string>('DATABASE_NAME', 'Kunemi Workspace'),
          entities,
          synchronize: true, // dev only — switch to migrations for prod
          logging,
        };
      },
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    BusinessesModule,
    TeamModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    DeliveriesModule,
    TrackingModule,
    DocumentsModule,
  ],
  controllers: [RootController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
