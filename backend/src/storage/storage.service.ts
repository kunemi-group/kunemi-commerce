import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { dirname, extname, join } from 'path';

export type UploadPurpose =
  | 'product'
  | 'variant'
  | 'brand'
  | 'document'
  | 'payment_proof'
  | 'misc';

export type StoredObject = {
  key: string;
  /** Public or app-served URL for clients */
  url: string;
  /** Provider: r2 | local */
  provider: 'r2' | 'local';
  contentType: string;
  size: number;
  filename: string;
};

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

const DEFAULT_ALLOWED = new Set(Object.keys(EXT_BY_MIME));

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private bucket = '';
  private publicBase = '';
  private accountId = '';
  private enabled = false;
  private readonly localRoot: string;
  private readonly apiPublicBase: string;

  constructor(private readonly config: ConfigService) {
    this.localRoot = join(process.cwd(), 'uploads');
    this.apiPublicBase =
      this.config.get<string>('API_PUBLIC_URL') ??
      `http://localhost:${this.config.get<string>('PORT') ?? '3001'}/api`;
  }

  async onModuleInit() {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID')?.trim();
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config
      .get<string>('R2_SECRET_ACCESS_KEY')
      ?.trim();
    const bucket = this.config.get<string>('R2_BUCKET')?.trim();
    const publicBase = this.config.get<string>('R2_PUBLIC_URL')?.trim() ?? '';

    if (accountId && accessKeyId && secretAccessKey && bucket) {
      this.accountId = accountId;
      this.bucket = bucket;
      this.publicBase = publicBase.replace(/\/$/, '');
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
      this.enabled = true;
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
        this.logger.log(`Cloudflare R2 ready (bucket=${bucket})`);
      } catch (err) {
        this.logger.warn(
          `R2 configured but HeadBucket failed: ${(err as Error).message}. Uploads will still be attempted.`,
        );
      }
    } else {
      this.logger.warn(
        'R2 not fully configured — using local uploads/ fallback (dev). Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.',
      );
      if (!existsSync(this.localRoot)) {
        mkdirSync(this.localRoot, { recursive: true });
      }
    }
  }

  isR2Enabled() {
    return this.enabled && Boolean(this.client);
  }

  status() {
    return {
      provider: this.isR2Enabled() ? 'r2' : 'local',
      bucket: this.isR2Enabled() ? this.bucket : null,
      publicBase: this.publicBase || null,
      localRoot: this.isR2Enabled() ? null : this.localRoot,
    };
  }

  /** Path-safe token for /api/media/:token (base64url of storage key). */
  encodeKey(key: string) {
    return Buffer.from(key, 'utf8').toString('base64url');
  }

  decodeKey(token: string) {
    return Buffer.from(token, 'base64url').toString('utf8');
  }

  /** Build a public or API-relative URL for a stored key. */
  publicUrl(key: string | null | undefined): string | null {
    if (!key) return null;
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    if (this.isR2Enabled() && this.publicBase) {
      return `${this.publicBase}/${key.replace(/^\//, '')}`;
    }
    // App-served (private R2 or local files) — single path segment, no slashes
    return `${this.apiPublicBase}/media/${this.encodeKey(key)}`;
  }

  buildKey(opts: {
    businessId: string;
    purpose: UploadPurpose;
    filename?: string;
    contentType: string;
  }) {
    const ext =
      EXT_BY_MIME[opts.contentType] ||
      extname(opts.filename || '').toLowerCase() ||
      '.bin';
    const safe =
      (opts.filename || 'file')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 60) || 'file';
    const id = randomUUID().slice(0, 8);
    return `businesses/${opts.businessId}/${opts.purpose}/${Date.now()}_${id}_${safe}${ext.startsWith('.') ? '' : ext}`.replace(
      /\.(jpg|jpeg|png|webp|gif|pdf){2,}$/i,
      (m) => m.replace(/(\.[^.]+)+$/, `$1`),
    );
  }

  async uploadBuffer(opts: {
    businessId: string;
    purpose: UploadPurpose;
    buffer: Buffer;
    contentType: string;
    filename?: string;
    key?: string;
    maxBytes?: number;
    allowedMime?: Set<string>;
  }): Promise<StoredObject> {
    const allowed = opts.allowedMime ?? DEFAULT_ALLOWED;
    const mime = opts.contentType || 'application/octet-stream';
    if (!allowed.has(mime)) {
      throw new BadRequestException(
        `Unsupported content type: ${mime}. Allowed: ${[...allowed].join(', ')}`,
      );
    }
    const max = opts.maxBytes ?? 8 * 1024 * 1024;
    if (!opts.buffer.length || opts.buffer.length > max) {
      throw new BadRequestException(
        `File must be between 1 byte and ${Math.round(max / (1024 * 1024))}MB`,
      );
    }

    const key =
      opts.key ??
      this.buildKey({
        businessId: opts.businessId,
        purpose: opts.purpose,
        filename: opts.filename,
        contentType: mime,
      });

    if (this.isR2Enabled() && this.client) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: opts.buffer,
          ContentType: mime,
        }),
      );
      return {
        key,
        url: this.publicUrl(key)!,
        provider: 'r2',
        contentType: mime,
        size: opts.buffer.length,
        filename: opts.filename || key.split('/').pop() || 'file',
      };
    }

    // Local fallback
    const abs = join(this.localRoot, key);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, opts.buffer);
    return {
      key,
      url: this.publicUrl(key)!,
      provider: 'local',
      contentType: mime,
      size: opts.buffer.length,
      filename: opts.filename || key.split('/').pop() || 'file',
    };
  }

  async uploadBase64(opts: {
    businessId: string;
    purpose: UploadPurpose;
    base64: string;
    contentType?: string;
    filename?: string;
    maxBytes?: number;
    allowedMime?: Set<string>;
  }): Promise<StoredObject> {
    let raw = opts.base64.trim();
    let mime = opts.contentType || 'application/octet-stream';
    const dataUrl = /^data:([^;]+);base64,(.+)$/i.exec(raw);
    if (dataUrl) {
      mime = dataUrl[1];
      raw = dataUrl[2];
    }
    let buffer: Buffer;
    try {
      buffer = Buffer.from(raw, 'base64');
    } catch {
      throw new BadRequestException('Invalid base64 payload');
    }
    return this.uploadBuffer({
      businessId: opts.businessId,
      purpose: opts.purpose,
      buffer,
      contentType: mime,
      filename: opts.filename,
      maxBytes: opts.maxBytes,
      allowedMime: opts.allowedMime,
    });
  }

  async getObject(
    key: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    if (!key) return null;

    if (this.isR2Enabled() && this.client) {
      try {
        const res = await this.client.send(
          new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        );
        const bytes = await res.Body?.transformToByteArray();
        if (!bytes) return null;
        return {
          buffer: Buffer.from(bytes),
          contentType: res.ContentType || 'application/octet-stream',
        };
      } catch {
        return null;
      }
    }

    const abs = join(this.localRoot, key);
    if (!existsSync(abs)) return null;
    const ext = extname(abs).toLowerCase();
    const contentType =
      Object.entries(EXT_BY_MIME).find(([, e]) => e === ext)?.[0] ||
      'application/octet-stream';
    return { buffer: readFileSync(abs), contentType };
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.isR2Enabled() && this.client) {
      if (this.publicBase) return this.publicUrl(key)!;
      return getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn },
      );
    }
    return this.publicUrl(key)!;
  }

  async delete(key: string | null | undefined) {
    if (!key) return;
    if (key.startsWith('http://') || key.startsWith('https://')) return;

    if (this.isR2Enabled() && this.client) {
      try {
        await this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
        );
      } catch (err) {
        this.logger.warn(`R2 delete failed for ${key}: ${(err as Error).message}`);
      }
      return;
    }

    try {
      const abs = join(this.localRoot, key);
      if (existsSync(abs)) unlinkSync(abs);
    } catch {
      /* ignore */
    }
  }
}
