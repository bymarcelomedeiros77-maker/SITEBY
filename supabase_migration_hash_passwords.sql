-- ====================================================================
-- MIGRATION: Password Hashing Implementation
-- ====================================================================
-- This migration adds password hashing support to the users table.
-- WARNING: This is a BREAKING CHANGE. All users will need to reset passwords.
-- ====================================================================

-- Step 1: Add password_hash column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Step 2: Comment on the new column
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password. Min 8 chars with letters and numbers required.';

-- Step 3: Update RLS policies to be more restrictive (commented out for now, apply manually)
-- This ensures users can only access their own data unless they are ADMIN

-- Drop existing permissive policies
-- DROP POLICY IF EXISTS "Allow public read on users" ON users;
-- DROP POLICY IF EXISTS "Allow public read on faccoes" ON faccoes;
-- DROP POLICY IF EXISTS "Allow public insert on faccoes" ON faccoes;
-- DROP POLICY IF EXISTS "Allow public update on faccoes" ON faccoes;
-- DROP POLICY IF EXISTS "Allow public read on cortes" ON cortes;
-- DROP POLICY IF EXISTS "Allow public insert on cortes" ON cortes;
-- DROP POLICY IF EXISTS "Allow public update on cortes" ON cortes;

-- Create new restrictive policies
-- Users can read their own user record
-- CREATE POLICY "Users can read own data" ON users
--     FOR SELECT
--     USING (id = (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')::uuid);

-- FAC\u00c7OES: All authenticated users can read
-- CREATE POLICY "Authenticated users can read faccoes" ON faccoes
--     FOR SELECT
--     TO authenticated
--     USING (true);

-- Only ADMINs can insert/update/delete faccoes
-- CREATE POLICY "Admins can manage faccoes" ON faccoes
--     FOR ALL
--     TO authenticated
--     USING ((SELECT role FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email') = 'ADMIN');

-- Similar policies for cortes, defect_types, metas, logs...

-- Step 4: Add last_seen column if not exists (for session management)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 5: Create index on email for faster login queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Step 6: Temporary fallback - keep password column for migration period
-- After all users have been migrated to password_hash, run:
-- ALTER TABLE users DROP COLUMN password;

-- ====================================================================
-- MANUAL STEPS AFTER RUNNING THIS MIGRATION:
-- ====================================================================
-- 1. For each user, generate a bcrypt hash of their password using bcryptjs
-- 2. Update the password_hash column with the generated hash
-- 3. Test login with the new system (it has fallback to plain password)
-- 4. Once all users are migrated, drop the password column
-- 5. Enable RLS policies (uncomment above)
-- ====================================================================

-- Example: How to generate hash and update (DO NOT RUN AS-IS, customize per user)
-- UPDATE users SET password_hash = '$2a$10$HASH_HERE' WHERE email = 'user@example.com';
