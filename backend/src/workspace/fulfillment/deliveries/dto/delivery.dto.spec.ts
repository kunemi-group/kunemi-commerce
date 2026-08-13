import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDeliveryDto, UpdateDeliveryStatusDto } from './delivery.dto';

describe('delivery URL validation', () => {
  it('accepts HTTPS external tracking URLs', async () => {
    const errors = await validate(
      plainToInstance(CreateDeliveryDto, {
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        fulfillmentMode: 'manual',
        externalTrackingUrl: 'https://courier.example/track/123',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects HTTP and javascript tracking URLs', async () => {
    for (const externalTrackingUrl of [
      'http://courier.example/track/123',
      'javascript:alert(1)',
    ]) {
      const errors = await validate(
        plainToInstance(UpdateDeliveryStatusDto, {
          status: 'out_for_delivery',
          externalTrackingUrl,
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    }
  });
});
