import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  decimal,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'member', 'guest']);
export const operationTypeEnum = pgEnum('operation_type', [
  'income',
  'withdrawal',
  'expense',
  'write_off',
]);
export const operationStatusEnum = pgEnum('operation_status', [
  'pending',
  'executed',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const currencies = pgTable('currencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const communalWallets = pgTable('communal_wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const walletCurrencies = pgTable('wallet_currencies', {
  walletId: uuid('wallet_id')
    .references(() => communalWallets.id, { onDelete: 'cascade' })
    .notNull(),
  currencyId: uuid('currency_id')
    .references(() => currencies.id, { onDelete: 'cascade' })
    .notNull(),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id')
    .references(() => communalWallets.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: roleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const subWallets = pgTable('sub_wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id')
    .references(() => communalWallets.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
});

export const balances = pgTable('balances', {
  id: uuid('id').defaultRandom().primaryKey(),
  subWalletId: uuid('sub_wallet_id')
    .references(() => subWallets.id, { onDelete: 'cascade' })
    .notNull(),
  currencyId: uuid('currency_id')
    .references(() => currencies.id)
    .notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull().default('0'),
});

export const operations = pgTable('operations', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id')
    .references(() => communalWallets.id, { onDelete: 'cascade' })
    .notNull(),
  type: operationTypeEnum('type').notNull(),
  currencyId: uuid('currency_id')
    .references(() => currencies.id)
    .notNull(),
  capAmount: decimal('cap_amount', { precision: 15, scale: 2 }).notNull(),
  status: operationStatusEnum('status').notNull().default('pending'),
  description: text('description'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  executedAt: timestamp('executed_at'),
});

export const operationAssignments = pgTable('operation_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  operationId: uuid('operation_id')
    .references(() => operations.id, { onDelete: 'cascade' })
    .notNull(),
  subWalletId: uuid('sub_wallet_id')
    .references(() => subWallets.id, { onDelete: 'cascade' })
    .notNull(),
  assignedAmount: decimal('assigned_amount', { precision: 15, scale: 2 })
    .notNull()
    .default('0'),
});
