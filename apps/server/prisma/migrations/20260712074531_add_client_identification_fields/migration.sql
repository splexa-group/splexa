/*
  Warnings:

  - Added the required column `firm_type` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FirmType" AS ENUM ('SOLO', 'FIRM');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('SON_OF', 'DAUGHTER_OF', 'WIFE_OF', 'HUSBAND_OF');

-- CreateEnum
CREATE TYPE "States" AS ENUM ('ANDHRA_PRADESH', 'ARUNACHAL_PRADESH', 'ASSAM', 'BIHAR', 'CHHATTISGARH', 'GOA', 'GUJARAT', 'HARYANA', 'HIMACHAL_PRADESH', 'JHARKHAND', 'KARNATAKA', 'KERALA', 'MADHYA_PRADESH', 'MAHARASHTRA', 'MANIPUR', 'MEGHALAYA', 'MIZORAM', 'NAGALAND', 'ODISHA', 'PUNJAB', 'RAJASTHAN', 'SIKKIM', 'TAMIL_NADU', 'TELANGANA', 'TRIPURA', 'UTTAR_PRADESH', 'UTTARAKHAND', 'WEST_BENGAL', 'ANDAMAN_AND_NICOBAR_ISLANDS', 'CHANDIGARH', 'DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU', 'DELHI', 'JAMMU_AND_KASHMIR', 'LADAKH', 'LAKSHADWEEP', 'PUDUCHERRY');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "relation_name" TEXT,
ADD COLUMN     "relation_type" "RelationType";

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "firm_type" "FirmType",
ADD COLUMN     "state" "States";

-- Backfill existing organization(s) before enforcing NOT NULL
UPDATE "organizations" SET "firm_type" = 'FIRM', "state" = 'DELHI' WHERE "firm_type" IS NULL;

ALTER TABLE "organizations" ALTER COLUMN "firm_type" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL;

-- AlterTable
ALTER TABLE "otp_requests" ADD COLUMN     "invalidated_at" TIMESTAMP(3);

-- RenameIndex
ALTER INDEX "sessions_token_hash_key" RENAME TO "sessions_refresh_token_hash_key";
