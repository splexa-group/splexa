-- AlterEnum
BEGIN;
CREATE TYPE "CaseStage_new" AS ENUM ('PRE_TRIAL', 'TRIAL', 'ARGUMENTS', 'JUDGMENT', 'EXECUTION');
ALTER TABLE "cases" ALTER COLUMN "stage" TYPE "CaseStage_new" USING (
  CASE "stage"::text
    WHEN 'PreTrial' THEN 'PRE_TRIAL'
    WHEN 'Trial' THEN 'TRIAL'
    WHEN 'Arguments' THEN 'ARGUMENTS'
    WHEN 'Judgment' THEN 'JUDGMENT'
    WHEN 'Execution' THEN 'EXECUTION'
  END::"CaseStage_new"
);
ALTER TYPE "CaseStage" RENAME TO "CaseStage_old";
ALTER TYPE "CaseStage_new" RENAME TO "CaseStage";
DROP TYPE "public"."CaseStage_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CaseStatus_new" AS ENUM ('ACTIVE', 'STAYED', 'DISPOSED', 'APPEALED');
ALTER TABLE "public"."cases" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "cases" ALTER COLUMN "status" TYPE "CaseStatus_new" USING (
  CASE "status"::text
    WHEN 'Active' THEN 'ACTIVE'
    WHEN 'Stayed' THEN 'STAYED'
    WHEN 'Disposed' THEN 'DISPOSED'
    WHEN 'Appealed' THEN 'APPEALED'
  END::"CaseStatus_new"
);
ALTER TYPE "CaseStatus" RENAME TO "CaseStatus_old";
ALTER TYPE "CaseStatus_new" RENAME TO "CaseStatus";
DROP TYPE "public"."CaseStatus_old";
ALTER TABLE "cases" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CaseType_new" AS ENUM ('CIVIL', 'CRIMINAL', 'FAMILY', 'CONSUMER', 'LABOUR', 'REVENUE', 'WRIT', 'CORPORATE', 'OTHER');
ALTER TABLE "cases" ALTER COLUMN "case_type" TYPE "CaseType_new" USING (
  CASE "case_type"::text
    WHEN 'Civil' THEN 'CIVIL'
    WHEN 'Criminal' THEN 'CRIMINAL'
    WHEN 'Family' THEN 'FAMILY'
    WHEN 'Consumer' THEN 'CONSUMER'
    WHEN 'Labour' THEN 'LABOUR'
    WHEN 'Revenue' THEN 'REVENUE'
    WHEN 'Writ' THEN 'WRIT'
    WHEN 'Corporate' THEN 'CORPORATE'
    WHEN 'Other' THEN 'OTHER'
  END::"CaseType_new"
);
ALTER TYPE "CaseType" RENAME TO "CaseType_old";
ALTER TYPE "CaseType_new" RENAME TO "CaseType";
DROP TYPE "public"."CaseType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ClientType_new" AS ENUM ('INDIVIDUAL', 'COMPANY', 'NGO', 'GOVERNMENT');
ALTER TABLE "clients" ALTER COLUMN "type" TYPE "ClientType_new" USING (
  CASE "type"::text
    WHEN 'Individual' THEN 'INDIVIDUAL'
    WHEN 'Company' THEN 'COMPANY'
    WHEN 'NGO' THEN 'NGO'
    WHEN 'Government' THEN 'GOVERNMENT'
  END::"ClientType_new"
);
ALTER TYPE "ClientType" RENAME TO "ClientType_old";
ALTER TYPE "ClientType_new" RENAME TO "ClientType";
DROP TYPE "public"."ClientType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CourtType_new" AS ENUM ('DISTRICT_COURT', 'HIGH_COURT', 'SUPREME_COURT', 'TRIBUNAL', 'CONSUMER_FORUM', 'FAMILY_COURT', 'OTHER');
ALTER TABLE "cases" ALTER COLUMN "court_type" TYPE "CourtType_new" USING (
  CASE "court_type"::text
    WHEN 'DistrictCourt' THEN 'DISTRICT_COURT'
    WHEN 'HighCourt' THEN 'HIGH_COURT'
    WHEN 'SupremeCourt' THEN 'SUPREME_COURT'
    WHEN 'Tribunal' THEN 'TRIBUNAL'
    WHEN 'ConsumerForum' THEN 'CONSUMER_FORUM'
    WHEN 'FamilyCourt' THEN 'FAMILY_COURT'
    WHEN 'Other' THEN 'OTHER'
  END::"CourtType_new"
);
ALTER TYPE "CourtType" RENAME TO "CourtType_old";
ALTER TYPE "CourtType_new" RENAME TO "CourtType";
DROP TYPE "public"."CourtType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "HearingPurpose_new" AS ENUM ('ARGUMENTS', 'EVIDENCE', 'CROSS_EXAMINATION', 'ORDER', 'MENTION', 'SETTLEMENT', 'MISCELLANEOUS');
ALTER TABLE "hearings" ALTER COLUMN "purpose" TYPE "HearingPurpose_new" USING (
  CASE "purpose"::text
    WHEN 'Arguments' THEN 'ARGUMENTS'
    WHEN 'Evidence' THEN 'EVIDENCE'
    WHEN 'CrossExamination' THEN 'CROSS_EXAMINATION'
    WHEN 'Order' THEN 'ORDER'
    WHEN 'Mention' THEN 'MENTION'
    WHEN 'Settlement' THEN 'SETTLEMENT'
    WHEN 'Miscellaneous' THEN 'MISCELLANEOUS'
  END::"HearingPurpose_new"
);
ALTER TYPE "HearingPurpose" RENAME TO "HearingPurpose_old";
ALTER TYPE "HearingPurpose_new" RENAME TO "HearingPurpose";
DROP TYPE "public"."HearingPurpose_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "HearingStatus_new" AS ENUM ('SCHEDULED', 'COMPLETED', 'ADJOURNED', 'CANCELLED');
ALTER TABLE "public"."hearings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "hearings" ALTER COLUMN "status" TYPE "HearingStatus_new" USING (
  CASE "status"::text
    WHEN 'Scheduled' THEN 'SCHEDULED'
    WHEN 'Completed' THEN 'COMPLETED'
    WHEN 'Adjourned' THEN 'ADJOURNED'
    WHEN 'Cancelled' THEN 'CANCELLED'
  END::"HearingStatus_new"
);
ALTER TYPE "HearingStatus" RENAME TO "HearingStatus_old";
ALTER TYPE "HearingStatus_new" RENAME TO "HearingStatus";
DROP TYPE "public"."HearingStatus_old";
ALTER TABLE "hearings" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ImportantDateType_new" AS ENUM ('HEARING_DATE', 'LIMITATION', 'BAIL_EXPIRY', 'STAY_EXPIRY', 'APPEAL_DEADLINE', 'INJUNCTION_VALIDITY', 'OTHER');
ALTER TABLE "important_dates" ALTER COLUMN "date_type" TYPE "ImportantDateType_new" USING (
  CASE "date_type"::text
    WHEN 'HearingDate' THEN 'HEARING_DATE'
    WHEN 'Limitation' THEN 'LIMITATION'
    WHEN 'BailExpiry' THEN 'BAIL_EXPIRY'
    WHEN 'StayExpiry' THEN 'STAY_EXPIRY'
    WHEN 'AppealDeadline' THEN 'APPEAL_DEADLINE'
    WHEN 'InjunctionValidity' THEN 'INJUNCTION_VALIDITY'
    WHEN 'Other' THEN 'OTHER'
  END::"ImportantDateType_new"
);
ALTER TYPE "ImportantDateType" RENAME TO "ImportantDateType_old";
ALTER TYPE "ImportantDateType_new" RENAME TO "ImportantDateType";
DROP TYPE "public"."ImportantDateType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PartyRole_new" AS ENUM ('PETITIONER', 'RESPONDENT', 'ACCUSED', 'COMPLAINANT');
ALTER TABLE "cases" ALTER COLUMN "client_role" TYPE "PartyRole_new" USING (
  CASE "client_role"::text
    WHEN 'Petitioner' THEN 'PETITIONER'
    WHEN 'Respondent' THEN 'RESPONDENT'
    WHEN 'Accused' THEN 'ACCUSED'
    WHEN 'Complainant' THEN 'COMPLAINANT'
  END::"PartyRole_new"
);
ALTER TYPE "PartyRole" RENAME TO "PartyRole_old";
ALTER TYPE "PartyRole_new" RENAME TO "PartyRole";
DROP TYPE "public"."PartyRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PreferredLanguage_new" AS ENUM ('ENGLISH', 'HINDI', 'TELUGU', 'TAMIL', 'KANNADA', 'MALAYALAM', 'MARATHI', 'BENGALI', 'GUJARATI', 'PUNJABI');
ALTER TABLE "clients" ALTER COLUMN "preferred_language" TYPE "PreferredLanguage_new" USING (
  CASE "preferred_language"::text
    WHEN 'English' THEN 'ENGLISH'
    WHEN 'Hindi' THEN 'HINDI'
    WHEN 'Telugu' THEN 'TELUGU'
    WHEN 'Tamil' THEN 'TAMIL'
    WHEN 'Kannada' THEN 'KANNADA'
    WHEN 'Malayalam' THEN 'MALAYALAM'
    WHEN 'Marathi' THEN 'MARATHI'
    WHEN 'Bengali' THEN 'BENGALI'
    WHEN 'Gujarati' THEN 'GUJARATI'
    WHEN 'Punjabi' THEN 'PUNJABI'
  END::"PreferredLanguage_new"
);
ALTER TYPE "PreferredLanguage" RENAME TO "PreferredLanguage_old";
ALTER TYPE "PreferredLanguage_new" RENAME TO "PreferredLanguage";
DROP TYPE "public"."PreferredLanguage_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Priority_new" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
ALTER TABLE "cases" ALTER COLUMN "priority" TYPE "Priority_new" USING (
  CASE "priority"::text
    WHEN 'High' THEN 'HIGH'
    WHEN 'Medium' THEN 'MEDIUM'
    WHEN 'Low' THEN 'LOW'
  END::"Priority_new"
);
ALTER TYPE "Priority" RENAME TO "Priority_old";
ALTER TYPE "Priority_new" RENAME TO "Priority";
DROP TYPE "public"."Priority_old";
COMMIT;

-- AlterTable
ALTER TABLE "cases" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "hearings" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
