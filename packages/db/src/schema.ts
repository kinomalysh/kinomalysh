import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  balance: integer('balance').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 24 }).notNull().default('casting'),
  plotId: varchar('plot_id', { length: 40 }),
  childName: varchar('child_name', { length: 30 }),
  childAge: integer('child_age'),
  gender: varchar('gender', { length: 8 }),
  format: varchar('format', { length: 8 }),
  tokensCost: integer('tokens_cost'),
  photoPath: text('photo_path'),
  avatars: jsonb('avatars').$type<string[]>().notNull().default([]),
  chosenAvatar: integer('chosen_avatar'),
  scenePrompts: jsonb('scene_prompts').$type<string[]>().notNull().default([]),
  scenes: jsonb('scenes').$type<string[]>().notNull().default([]),
  resultUrl: text('result_url'),
  failReason: text('fail_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tokenLedger = pgTable('token_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(),
  kind: varchar('kind', { length: 16 }).notNull(),
  storyId: uuid('story_id'),
  paymentId: uuid('payment_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  packId: varchar('pack_id', { length: 40 }).notNull(),
  amountMinor: integer('amount_minor').notNull(),
  tokens: integer('tokens').notNull(),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  casheraUuid: varchar('cashera_uuid', { length: 64 }),
  paymentUrl: text('payment_url'),
  credited: boolean('credited').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const webhookEvents = pgTable(
  'webhook_events',
  {
    eventUuid: varchar('event_uuid', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.eventUuid, t.status] })],
)

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const emailOtps = pgTable('email_otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  login: varchar('login', { length: 64 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const adminRefreshTokens = pgTable('admin_refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 60 }).notNull().unique(),
  title: varchar('title', { length: 120 }).notNull(),
  tagline: varchar('tagline', { length: 200 }),
  status: varchar('status', { length: 16 }).notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const productScenes = pgTable('product_scenes', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  kind: varchar('kind', { length: 12 }).notNull(),
  title: varchar('title', { length: 120 }),
  prompt: text('prompt').notNull().default(''),
  voiceoverText: text('voiceover_text'),
  motionPrompt: text('motion_prompt'),
  clipKey: text('clip_key'),
  clipUrl: text('clip_url'),
  clipStatus: varchar('clip_status', { length: 12 }).notNull().default('idle'),
  voKey: text('vo_key'),
  voStatus: varchar('vo_status', { length: 12 }).notNull().default('idle'),
  failReason: text('fail_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const settings = pgTable('settings', {
  key: varchar('key', { length: 60 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const adReels = pgTable('ad_reels', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 8 }).notNull(),
  title: varchar('title', { length: 120 }),
  scenePrompt: text('scene_prompt').notNull(),
  fullPrompt: text('full_prompt').notNull(),
  motionPrompt: text('motion_prompt'),
  inputPhotos: jsonb('input_photos').$type<string[]>().notNull().default([]),
  firstFrameUrl: text('first_frame_url'),
  status: varchar('status', { length: 16 }).notNull().default('queued'),
  resultUrl: text('result_url'),
  resultKey: text('result_key'),
  failReason: text('fail_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
