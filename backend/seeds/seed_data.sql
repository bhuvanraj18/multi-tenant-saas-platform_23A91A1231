-- ==============================
-- SUPER ADMIN
-- Password: Admin@123
-- ==============================
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'superadmin@system.com',
  '$2b$10$Jgu2IOyEv2gG7VXsh8/I0uR7vKgXnsx4l4NnW5y9NxS8jJYXxN8I2',
  'System Super Admin',
  'super_admin'
)
ON CONFLICT DO NOTHING;

-- ==============================
-- DEMO TENANT
-- ==============================
INSERT INTO tenants (id, name, subdomain, status, subscription_plan)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Company',
  'demo',
  'active',
  'pro'
)
ON CONFLICT DO NOTHING;

-- ==============================
-- TENANT ADMIN
-- Password: Demo@123
-- ==============================
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'admin@demo.com',
  '$2b$10$SVcL5qs7bnrC.yYYOZJZEeUCgrTgwWJ2wuVwFALt3ocX/N4iWMk1e',
  'Demo Admin',
  'tenant_admin'
)
ON CONFLICT DO NOTHING;

-- ==============================
-- REGULAR USERS
-- Password: User@123
-- ==============================
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
VALUES
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'user1@demo.com',
  '$2b$10$a3rNYEmEfgYKVb.u5s0dsO/k5dFWy3WI6.xR7.9Ro5WwHHrZkCeYW',
  'User One',
  'user'
),
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'user2@demo.com',
  '$2b$10$a3rNYEmEfgYKVb.u5s0dsO/k5dFWy3WI6.xR7.9Ro5WwHHrZkCeYW',
  'User Two',
  'user'
)
ON CONFLICT DO NOTHING;
