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
import { StorageModule } from './storage/storage.module';
import { StoreModule } from './store/store.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { validateEnvironment } from './common/config/environment';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CsrfOriginGuard } from './common/guards/csrf-origin.guard';
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
  ChatThread,
  ChatMessage,
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
      storage: ['POST /api/uploads', 'GET /api/media/:token', 'GET /api/storage/status'],
      storefront: [
        'GET /api/store/:slug',
        'GET /api/store/:slug/products',
        'GET /api/store/:slug/products/:productId',
      ],
      documents: [
        'GET|POST /api/quotations',
        'GET|POST /api/invoices',
        'POST /api/quotations/:id/convert-to-invoice',
      ],
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      validate: validateEnvironment,
    }),
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
          ChatThread,
          ChatMessage,
        ];
        const logging = config.get<string>('TYPEORM_LOGGING') === 'true';
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        // Prefer Postgres in prod; better-sqlite3 for local dev without Docker
        const dbType = config.get<string>('DATABASE_TYPE', 'postgres');
        if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
          return {
            type: 'better-sqlite3',
            database: config.get<string>('SQLITE_PATH', 'shopflow.dev.sqlite'),
            entities,
            synchronize:
              !isProduction && config.get<string>('ALLOW_SQLITE_SYNC') === 'true',
            logging,
          };
        }
        return {
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: Number(config.get<string>('DATABASE_PORT', '5432')),
          username: config.get<string>('DATABASE_USER', 'shopflow'),
          password: config.getOrThrow<string>('DATABASE_PASSWORD'),
          database: config.get<string>('DATABASE_NAME', 'shopflow'),
          entities,
          synchronize: false,
          migrationsRun: false,
          migrations: [__dirname + '/database/migrations/*{.js,.ts}'],
          logging,
        };
      },
    }),
    DatabaseModule,
    CommonModule,
    StorageModule,
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
    StoreModule,
    ChatModule,
    AdminModule,
    MailModule,
  ],
  controllers: [RootController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfOriginGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
