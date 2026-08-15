import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import type { SuperAgentTest } from 'supertest';
import { applyHttpSecurity } from './../src/common/http/http-security';
import { AppModule } from './../src/app.module';

jest.setTimeout(120_000);

describe('Kunemi Workspace API (e2e)', () => {
  let app: INestApplication<App>;
  let agent: SuperAgentTest;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_TYPE = 'sqlite';
    process.env.SQLITE_PATH = 'kunemi-workspace.e2e.sqlite';
    process.env.SEED_ON_BOOT = 'true';
    process.env.ALLOW_SQLITE_SYNC = 'true';
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.CORS_ORIGIN = 'http://localhost:3000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyHttpSecurity(app);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    agent = request.agent(app.getHttpServer());

    const login = await agent
      .post('/api/auth/login')
      .send({ email: 'owner@lagosthreads.co', password: 'password123' });

    if (login.status !== 201 && login.status !== 200) {
      await agent
        .post('/api/auth/register')
        .send({
          businessName: 'E2E Shop',
          email: 'e2e@test.com',
          password: 'password123',
          fullName: 'E2E Owner',
        })
        .expect(201);
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
        expect(res.headers['x-request-id']).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('DENY');
        expect(res.headers['referrer-policy']).toBe('no-referrer');
      });
  });

  it('/api/orders freeform (POST) requires auth', async () => {
    await request(app.getHttpServer()).post('/api/orders').send({}).expect(401);

    const res = await agent
      .post('/api/orders')
      .set('Origin', 'http://localhost:3000')
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
    expect(res.body.reservedUntil).toEqual(expect.any(String));
    expect(res.body.shippingFeeCents).toBe(250000);
    expect(res.body.taxCents).toBeGreaterThan(0);

    const paymentToken = res.body.payment.paymentToken;
    const paymentId = res.body.payment.id;

    await request(app.getHttpServer())
      .get(`/api/pay/${paymentToken}`)
      .expect(200)
      .expect((publicPayment) => {
        expect(publicPayment.body.token).toBe(paymentToken);
        expect(publicPayment.body.canClaim).toBe(true);
      });

    await request(app.getHttpServer())
      .post(`/api/pay/${paymentToken}/claim`)
      .set('Origin', 'http://localhost:3000')
      .send({ customerNote: 'Transfer completed' })
      .expect(201)
      .expect((claim) => {
        expect(claim.body.paymentStatus).toBe('claimed');
        expect(claim.body.orderStatus).toBe('payment_review');
      });

    await agent
      .patch(`/api/payments/${paymentId}/verify`)
      .set('Origin', 'http://localhost:3000')
      .send({ note: 'Confirmed in bank statement' })
      .expect(200)
      .expect((verified) => {
        expect(verified.body.status).toBe('verified');
      });

    await agent
      .post('/api/deliveries')
      .set('Origin', 'http://localhost:3000')
      .send({
        orderId: res.body.id,
        fulfillmentMode: 'manual',
        externalTrackingUrl: 'http://insecure.example/track/1',
      })
      .expect(400);

    const delivery = await agent
      .post('/api/deliveries')
      .set('Origin', 'http://localhost:3000')
      .send({ orderId: res.body.id, fulfillmentMode: 'manual' })
      .expect(201);

    const deliveryId = delivery.body.id;
    const trackingToken = delivery.body.trackingToken;
    expect(delivery.body.status).toBe('awaiting_pickup');

    await agent
      .patch(`/api/deliveries/${deliveryId}/status`)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'picked_up' })
      .expect(200);
    await agent
      .patch(`/api/deliveries/${deliveryId}/status`)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'out_for_delivery' })
      .expect(200);
    await agent
      .patch(`/api/deliveries/${deliveryId}/status`)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'delivered' })
      .expect(200)
      .expect((updated) => expect(updated.body.status).toBe('delivered'));

    await request(app.getHttpServer())
      .get(`/api/tracking/${trackingToken}`)
      .expect(200)
      .expect((tracking) => {
        expect(tracking.body.status).toBe('delivered');
        expect(tracking.body.eta).toBe('Delivered');
      });
  });

  it('/api/products (GET) requires business authentication', async () => {
    await request(app.getHttpServer()).get('/api/products').expect(401);

    await agent
      .get('/api/products')
      .set('Origin', 'http://localhost:3000')
      .expect(200)
      .expect((res) => {
        expect(res.body.optional).toBe(true);
        expect(Array.isArray(res.body.products)).toBe(true);
      });
  });

  it('/api/team protects invite and role-management actions', async () => {
    await request(app.getHttpServer())
      .post('/api/team/invite')
      .send({})
      .expect(401);

    const email = `e2e-team-${Date.now()}@test.com`;
    const invited = await agent
      .post('/api/team/invite')
      .set('Origin', 'http://localhost:3000')
      .send({
        email,
        fullName: 'E2E Team Member',
        role: 'sales',
        password: 'Temporary123!',
      })
      .expect(201);

    const memberId = invited.body.member.id;
    // Product surface: Team only (stored as sales). Legacy ops/manager invites rejected.
    expect(invited.body.member.role).toBe('sales');

    await agent
      .patch(`/api/team/${memberId}/role`)
      .set('Origin', 'http://localhost:3000')
      .send({ role: 'ops' })
      .expect(400);

    await agent
      .patch(`/api/team/${memberId}/role`)
      .set('Origin', 'http://localhost:3000')
      .send({ role: 'sales' })
      .expect(200)
      .expect((res) => expect(res.body.role).toBe('sales'));

    await agent
      .delete(`/api/team/${memberId}`)
      .set('Origin', 'http://localhost:3000')
      .expect(200)
      .expect((res) => expect(res.body).toEqual({ ok: true, id: memberId }));
  });

  it('/api/admin/seed (POST) is not exposed', () => {
    return request(app.getHttpServer())
      .post('/api/admin/seed')
      .send({})
      .expect(404);
  });

  it('uses HttpOnly cookies without returning browser-readable tokens', async () => {
    const response = await agent
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'owner@lagosthreads.co', password: 'password123' })
      .expect(201);

    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.refreshToken).toBeUndefined();
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((cookie) => cookie.includes('HttpOnly'))).toBe(true);
    expect(cookies.some((cookie) => cookie.includes('SameSite=Lax'))).toBe(
      true,
    );
  });

  it('rejects state-changing cookie requests from an untrusted origin', () => {
    return agent
      .post('/api/orders')
      .set('Origin', 'https://attacker.example')
      .send({})
      .expect(403);
  });

  it('refreshes from the HttpOnly cookie and clears the session on logout', async () => {
    const refresh = await agent
      .post('/api/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .send({})
      .expect(201);

    expect(refresh.body.accessToken).toBeUndefined();
    expect(refresh.body.refreshToken).toBeUndefined();
    expect(refresh.headers['set-cookie']).toEqual(expect.any(Array));

    const logout = await agent
      .post('/api/auth/logout')
      .set('Origin', 'http://localhost:3000')
      .expect(201);

    expect(logout.body).toEqual({ message: 'Logged out successfully' });
    expect((logout.headers['set-cookie'] as string[]).join(';')).toContain(
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    );
  });
});
