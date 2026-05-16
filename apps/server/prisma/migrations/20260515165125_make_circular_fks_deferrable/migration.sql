-- Make circular FK constraints deferrable so the org+user signup transaction works.
-- organizations.created_by → users.id and users.org_id → organizations.id form a
-- cycle that requires both rows to be inserted in the same transaction with
-- constraint checking deferred until commit.

ALTER TABLE "organizations" DROP CONSTRAINT "organizations_created_by_fkey";
ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "users" DROP CONSTRAINT "users_org_id_fkey";
ALTER TABLE "users"
  ADD CONSTRAINT "users_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;
