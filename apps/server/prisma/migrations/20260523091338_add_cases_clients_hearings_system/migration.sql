-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('PreTrial', 'Trial', 'Arguments', 'Judgment', 'Execution');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('Active', 'Stayed', 'Disposed', 'Appealed');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('Civil', 'Criminal', 'Family', 'Consumer', 'Labour', 'Revenue', 'Writ', 'Corporate', 'Other');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('Individual', 'Company', 'NGO', 'Government');

-- CreateEnum
CREATE TYPE "CourtType" AS ENUM ('DistrictCourt', 'HighCourt', 'SupremeCourt', 'Tribunal', 'ConsumerForum', 'FamilyCourt', 'Other');

-- CreateEnum
CREATE TYPE "HearingPurpose" AS ENUM ('Arguments', 'Evidence', 'CrossExamination', 'Order', 'Mention', 'Settlement', 'Miscellaneous');

-- CreateEnum
CREATE TYPE "HearingStatus" AS ENUM ('Scheduled', 'Completed', 'Adjourned', 'Cancelled');

-- CreateEnum
CREATE TYPE "ImportantDateType" AS ENUM ('Limitation', 'BailExpiry', 'StayExpiry', 'AppealDeadline', 'InjunctionValidity', 'Other');

-- CreateEnum
CREATE TYPE "PartyRole" AS ENUM ('Petitioner', 'Respondent', 'Accused', 'Complainant');

-- CreateEnum
CREATE TYPE "PreferredLanguage" AS ENUM ('English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "ScheduledEventType" AS ENUM ('HearingDate', 'ImportantDate');

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "practice_types" DROP DEFAULT;

-- CreateTable
CREATE TABLE "case_important_dates" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "date_type" "ImportantDateType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "case_important_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_role" "PartyRole" NOT NULL,
    "case_number" TEXT,
    "case_type" "CaseType",
    "filing_date" TIMESTAMP(3),
    "court_name" TEXT,
    "court_type" "CourtType",
    "court_state" TEXT,
    "court_city" TEXT,
    "bench_number" TEXT,
    "judge_name" TEXT,
    "judge_designation" TEXT,
    "judge_updated_at" TIMESTAMP(3),
    "status" "CaseStatus" NOT NULL DEFAULT 'Active',
    "stage" "CaseStage",
    "priority" "Priority",
    "opposite_parties" JSONB,
    "notes" TEXT,
    "tags" TEXT[],
    "next_hearing_date" TIMESTAMP(3),
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "ClientType" NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "company_name" TEXT,
    "notes" TEXT,
    "preferred_language" "PreferredLanguage",
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hearings" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "purpose" "HearingPurpose",
    "status" "HearingStatus" NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "next_date" TIMESTAMP(3),
    "adjournment_reason" TEXT,
    "judge_present" TEXT,
    "added_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hearings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_events" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "type" "ScheduledEventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "notify_user_id" TEXT NOT NULL,
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scheduled_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_important_dates_org_id_date_idx" ON "case_important_dates"("org_id", "date");

-- CreateIndex
CREATE INDEX "case_important_dates_case_id_idx" ON "case_important_dates"("case_id");

-- CreateIndex
CREATE INDEX "case_important_dates_org_id_deleted_at_idx" ON "case_important_dates"("org_id", "deleted_at");

-- CreateIndex
CREATE INDEX "cases_org_id_idx" ON "cases"("org_id");

-- CreateIndex
CREATE INDEX "cases_org_id_status_idx" ON "cases"("org_id", "status");

-- CreateIndex
CREATE INDEX "cases_org_id_client_id_idx" ON "cases"("org_id", "client_id");

-- CreateIndex
CREATE INDEX "cases_org_id_deleted_at_idx" ON "cases"("org_id", "deleted_at");

-- CreateIndex
CREATE INDEX "cases_org_id_next_hearing_date_idx" ON "cases"("org_id", "next_hearing_date");

-- CreateIndex
CREATE INDEX "clients_org_id_idx" ON "clients"("org_id");

-- CreateIndex
CREATE INDEX "clients_org_id_deleted_at_idx" ON "clients"("org_id", "deleted_at");

-- CreateIndex
CREATE INDEX "clients_org_id_phone_idx" ON "clients"("org_id", "phone");

-- CreateIndex
CREATE INDEX "hearings_case_id_idx" ON "hearings"("case_id");

-- CreateIndex
CREATE INDEX "hearings_org_id_date_idx" ON "hearings"("org_id", "date");

-- CreateIndex
CREATE INDEX "hearings_org_id_status_idx" ON "hearings"("org_id", "status");

-- CreateIndex
CREATE INDEX "hearings_org_id_deleted_at_idx" ON "hearings"("org_id", "deleted_at");

-- CreateIndex
CREATE INDEX "scheduled_events_org_id_date_idx" ON "scheduled_events"("org_id", "date");

-- CreateIndex
CREATE INDEX "scheduled_events_source_id_idx" ON "scheduled_events"("source_id");

-- CreateIndex
CREATE INDEX "scheduled_events_org_id_deleted_at_idx" ON "scheduled_events"("org_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "case_important_dates" ADD CONSTRAINT "case_important_dates_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_important_dates" ADD CONSTRAINT "case_important_dates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
