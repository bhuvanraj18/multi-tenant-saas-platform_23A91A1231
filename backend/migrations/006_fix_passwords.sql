-- Fix Super Admin password (Admin@123)
UPDATE users
SET password_hash = '$2b$10$Jgu2IOyEv2gG7VXsh8/I0uR7vKgXnsx4l4NnW5y9NxS8jJYXxN8I2'
WHERE email = 'superadmin@system.com';

-- Fix Tenant Admin password (Demo@123)
UPDATE users
SET password_hash = '$2b$10$SVcL5qs7bnrC.yYYOZJZEeUCgrTgwWJ2wuVwFALt3ocX/N4iWMk1e'
WHERE email = 'admin@demo.com';

-- Fix Regular Users password (User@123)
UPDATE users
SET password_hash = '$2b$10$a3rNYEmEfgYKVb.u5s0dsO/k5dFWy3WI6.xR7.9Ro5WwHHrZkCeYW'
WHERE email IN ('user1@demo.com', 'user2@demo.com');
