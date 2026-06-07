/*
  Warnings:

  - You are about to drop the column `notes` on the `cases` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_client_id_fkey";

-- AlterTable
ALTER TABLE "cases" DROP COLUMN "notes",
ADD COLUMN     "description" TEXT,
ALTER COLUMN "client_id" DROP NOT NULL,
ALTER COLUMN "client_role" DROP NOT NULL;

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_org_id_idx" ON "documents"("org_id");

-- CreateIndex
CREATE INDEX "documents_case_id_org_id_idx" ON "documents"("case_id", "org_id");

-- CreateIndex
CREATE INDEX "documents_org_id_deleted_at_idx" ON "documents"("org_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
