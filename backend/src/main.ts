import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    // Include ShopFlow storefront origins via CORS_ORIGIN (comma-separated)
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3002',
    ],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Kunemi Commerce API')
    .setDescription(
      'Multi-Tenant Social Commerce Back-Office & ShopFlow Marketplace API for WhatsApp / Instagram selling.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('Auth', 'Registration, login, and JWT identity management')
    .addTag('Businesses', 'Business settings, multi-currency, and store profiles')
    .addTag('Orders', 'Order creation, inventory holds, and state transitions')
    .addTag('Payments', 'Bank transfer payments, proof uploads, and verification')
    .addTag('Deliveries', 'Fulfillment, shipping status, and courier management')
    .addTag('Tracking', 'Public tracking link endpoints')
    .addTag('Documents', 'Quotations and invoice generation')
    .addTag('Inventory', 'Products, variants, stock management, and restock API')
    .addTag('Store', 'ShopFlow public storefront catalog APIs')
    .addTag('Chat', 'In-app buyer-seller chat threads and messages')
    .addTag('Team', 'Staff invitation and role-based access control (RBAC)')
    .addTag('Admin', 'Platform Super Admin executive metrics & merchant management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Kunemi Commerce API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Kunemi Workspace API listening on http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`Swagger OpenAPI Documentation live at http://localhost:${port}/api/docs`);
}
void bootstrap();
