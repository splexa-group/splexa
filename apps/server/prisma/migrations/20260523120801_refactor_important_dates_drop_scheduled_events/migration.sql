/*
  Warnings:

  - You are about to drop the `case_important_dates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scheduled_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "ImportantDateType" ADD VALUE 'HearingDate';

-- DropForeignKey
ALTER TABLE "case_important_dates" DROP CONSTRAINT "case_important_dates_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_important_dates" DROP CONSTRAINT "case_important_dates_org_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_events" DROP CONSTRAINT "scheduled_events_case_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_events" DROP CONSTRAINT "scheduled_events_org_id_fkey";

-- DropTable
DROP TABLE "case_important_dates";

-- DropTable
DROP TABLE "scheduled_events";

-- DropEnum
DROP TYPE "ScheduledEventType";

-- CreateTable
CREATE TABLE "important_dates" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "date_type" "ImportantDateType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "source_id" TEXT,
    "notify_user_id" TEXT NOT NULL,
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "important_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "important_dates_org_id_date_idx" ON "important_dates"("org_id", "date");

-- CreateIndex
CREATE INDEX "important_dates_case_id_idx" ON "important_dates"("case_id");

-- CreateIndex
CREATE INDEX "important_dates_org_id_deleted_at_idx" ON "important_dates"("org_id", "deleted_at");

-- CreateIndex
CREATE INDEX "important_dates_org_id_notified_at_idx" ON "important_dates"("org_id", "notified_at");

-- AddForeignKey
ALTER TABLE "important_dates" ADD CONSTRAINT "important_dates_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "important_dates" ADD CONSTRAINT "important_dates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
