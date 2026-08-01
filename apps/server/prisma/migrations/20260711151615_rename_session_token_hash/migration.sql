-- Rename sessions.token_hash to sessions.refresh_token_hash for clarity —
-- this column always holds a hash of a refresh token specifically, not a
-- generic "token."

ALTER TABLE "sessions" RENAME COLUMN "token_hash" TO "refresh_token_hash";
