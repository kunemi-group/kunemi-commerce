import 'reflect-metadata';
import { DataSource } from 'typeorm';
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
} from './entities';

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

const databaseType = process.env.DATABASE_TYPE ?? 'postgres';

export default new DataSource(
  databaseType === 'sqlite' || databaseType === 'better-sqlite3'
    ? {
        type: 'better-sqlite3',
        database: process.env.SQLITE_PATH ?? 'shopflow.dev.sqlite',
        entities,
        migrations: [__dirname + '/migrations/*{.js,.ts}'],
        synchronize: false,
      }
    : {
        type: 'postgres',
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: Number(process.env.DATABASE_PORT ?? 5432),
        username: process.env.DATABASE_MIGRATION_USER ?? process.env.DATABASE_USER ?? 'shopflow',
        password: process.env.DATABASE_MIGRATION_PASSWORD ?? process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME ?? 'shopflow',
        entities,
        migrations: [__dirname + '/migrations/*{.js,.ts}'],
        synchronize: false,
      },
);
