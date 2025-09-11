
BEGIN;

ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "user_sessions_userId_fkey";
ALTER TABLE "workspace_activities" DROP CONSTRAINT IF EXISTS "workspace_activities_userId_fkey";

DROP INDEX IF EXISTS "user_sessions_userId_revoked_idx";
DROP INDEX IF EXISTS "workspace_activities_userId_createdAt_idx";

DROP TABLE IF EXISTS "user_sessions";
DROP TABLE IF EXISTS "workspace_activities";

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "emailNotifications",
  DROP COLUMN IF EXISTS "emailUpdate",
  DROP COLUMN IF EXISTS "onlineStatus",
  DROP COLUMN IF EXISTS "privateProfile",
  DROP COLUMN IF EXISTS "pushNotifications";

COMMIT;
