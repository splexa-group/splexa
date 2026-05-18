-- Drop old single-value column
ALTER TABLE "organizations" DROP COLUMN "practice_type";

-- Add new array column (required, minimum one value enforced at application layer)
ALTER TABLE "organizations" ADD COLUMN "practice_types" "PracticeType"[] NOT NULL DEFAULT '{}';
