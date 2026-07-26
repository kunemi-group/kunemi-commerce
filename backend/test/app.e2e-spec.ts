import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Kunemi Workspace API (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    process.env.DATABASE_TYPE = 'sqlite';
    process.env.SQLITE_PATH = 'kunemi-workspace.e2e.sqlite';
    process.env.SEED_ON_BOOT = 'true';
    process.env.JWT_SECRET = 'e2e-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'owner@lagosthreads.co', password: 'password123' });

    if (login.status === 201 || login.status === 200) {
      token = login.body.accessToken;
    } else {
      const reg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          businessName: 'E2E Shop',
          email: 'e2e@test.com',
          password: 'password123',
          fullName: 'E2E Owner',
        })
        .expect(201);
      token = reg.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('/api/orders freeform (POST) requires auth', async () => {
    await request(app.getHttpServer()).post('/api/orders').send({}).expect(401);

    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Ada',
        customerPhone: '+234800',
        customerEmail: 'ada@example.com',
        shippingFeeCents: 250000,
        items: [
          {
            description: 'Consulting package',
            quantity: 1,
            unitPriceCents: 5000000,
            taxExempt: false,
          },
        ],
      })
      .expect(201);

    expect(res.body.status).toBe('pending');
    expect(res.body.customerEmail).toBe('ada@example.com');
    expect(res.body.reservedUntil).toBeNull();
    expect(res.body.shippingFeeCents).toBe(250000);
    expect(res.body.taxCents).toBeGreaterThan(0);
  });
});
