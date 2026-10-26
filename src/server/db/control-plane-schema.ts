import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * CONTROL PLANE DATABASE SCHEMA (Central DB)
 * Manages global identity, authentication (Better Auth compatible),
 * clinics (tenants), memberships, and Turso tenant DB connection credentials.
 */

// 1. Clinics (Tenants)
export const clinics = sqliteTable('clinics', {
  id: text('id').primaryKey(), // c_... or UUID
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email').notNull(),
  phone: text('phone'),
  subdomain: text('subdomain'), // Custom subdomain: slug.vitalisttrack.com
  customDomain: text('custom_domain'), // Custom branded domain: citas.miclinica.com
  customDomainVerified: integer('custom_domain_verified', { mode: 'boolean' }).default(false).notNull(),
  plan: text('plan', { enum: ['free', 'solo', 'pro', 'plus', 'business', 'starter', 'enterprise'] }).default('solo').notNull(),
  status: text('status', { enum: ['active', 'suspended', 'trialing'] }).default('trialing').notNull(),
  trialEndsAt: text('trial_ends_at'), // 30 days trial timestamp
  maxBranches: integer('max_branches').default(1).notNull(),
  maxUsers: integer('max_users').default(3).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 2. Users (Accounts - Better Auth Standard)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  systemRole: text('system_role', { enum: ['user', 'superadmin'] }).default('user').notNull(),
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 3. User Sessions (Better Auth)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  activeClinicId: text('active_clinic_id'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 4. Accounts / Passwords (Better Auth)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: text('expires_at'),
  password: text('password'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 5. Verifications / OTPs (Better Auth)
export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 6. Memberships (User <-> Clinic Association)
export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  clinicId: text('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', {
    enum: ['owner', 'admin', 'doctor', 'specialist', 'receptionist', 'nurse']
  }).notNull(),
  status: text('status', { enum: ['active', 'invited', 'suspended'] }).default('active').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 7. Clinic Databases (Turso LibSQL per-tenant credentials)
export const clinicDatabases = sqliteTable('clinic_databases', {
  id: text('id').primaryKey(),
  clinicId: text('clinic_id').notNull().unique().references(() => clinics.id, { onDelete: 'cascade' }),
  tursoDbName: text('turso_db_name').notNull(),
  tursoDbUrl: text('turso_db_url').notNull(),
  tursoAuthTokenEncrypted: text('turso_auth_token_encrypted').notNull(),
  status: text('status', { enum: ['provisioning', 'active', 'suspended', 'error'] }).default('provisioning').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 8. Audit Logs (Control Plane Level)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  clinicId: text('clinic_id'),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  ipAddress: text('ip_address'),
  payloadJson: text('payload_json'),
  timestamp: text('timestamp').notNull().$defaultFn(() => new Date().toISOString()),
});
