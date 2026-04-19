-- Remove auth.users FK constraints while auth is disabled
-- The admin client bypasses RLS, but the FK constraint still blocks
-- inserts with a user_id that doesn't exist in auth.users.

ALTER TABLE todos DROP CONSTRAINT todos_user_id_fkey;
ALTER TABLE reconciliation_templates DROP CONSTRAINT reconciliation_templates_user_id_fkey;
