-- Rename column to preserve existing data (Prisma's own diff would drop+add, losing values)
ALTER TABLE "hearings" RENAME COLUMN "judge_present" TO "judge_name";
