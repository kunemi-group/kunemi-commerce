import { BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'API_PUBLIC_URL') return 'http://localhost:3001/api';
      if (key === 'PORT') return '3001';
      return fallback;
    }),
  };

  it('encodes storage keys into API-safe media URLs', () => {
    const service = new StorageService(config as never);
    const key = 'businesses/business-1/product/image one.jpg';

    const token = service.encodeKey(key);

    expect(service.decodeKey(token)).toBe(key);
    expect(service.publicUrl(key)).toBe(
      `http://localhost:3001/api/media/${token}`,
    );
  });

  it('builds tenant and purpose scoped keys with a sanitized filename', () => {
    const service = new StorageService(config as never);

    const key = service.buildKey({
      businessId: 'business-1',
      purpose: 'payment_proof',
      filename: '../../receipt?.png',
      contentType: 'image/png',
    });

    expect(key).toMatch(/^businesses\/business-1\/payment_proof\/[^/]+\.png$/);
    expect(key).not.toContain('..');
  });

  it('rejects unsupported types and oversized uploads before writing', async () => {
    const service = new StorageService(config as never);

    await expect(
      service.uploadBuffer({
        businessId: 'business-1',
        purpose: 'misc',
        buffer: Buffer.from('data'),
        contentType: 'text/html',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.uploadBuffer({
        businessId: 'business-1',
        purpose: 'misc',
        buffer: Buffer.from('12345'),
        contentType: 'image/png',
        maxBytes: 4,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not read or delete paths outside the local upload root', async () => {
    const service = new StorageService(config as never);

    await expect(service.getObject('../outside.txt')).resolves.toBeNull();
    await expect(service.delete('../outside.txt')).resolves.toBeUndefined();
  });
});
