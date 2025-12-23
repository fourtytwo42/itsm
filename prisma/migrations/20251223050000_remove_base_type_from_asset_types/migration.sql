-- DropIndex
DROP INDEX IF EXISTS "CustomAssetType_baseType_idx";

-- AlterTable
ALTER TABLE "CustomAssetType" DROP CONSTRAINT IF EXISTS "CustomAssetType_organizationId_name_baseType_key";
ALTER TABLE "CustomAssetType" DROP COLUMN IF EXISTS "baseType";

-- CreateIndex
CREATE UNIQUE INDEX "CustomAssetType_organizationId_name_key" ON "CustomAssetType"("organizationId", "name");

-- AlterTable
ALTER TABLE "Asset" ALTER COLUMN "type" DROP NOT NULL;

