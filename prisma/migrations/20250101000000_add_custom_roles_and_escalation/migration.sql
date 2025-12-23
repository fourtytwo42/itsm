-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "UserRole" 
    ADD COLUMN "customRoleId" TEXT,
    ALTER COLUMN "roleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" 
    ADD COLUMN "escalatedToRoleId" TEXT,
    ADD COLUMN "escalatedToSystemRole" "RoleName",
    ADD COLUMN "escalatedAt" TIMESTAMP(3),
    ADD COLUMN "escalatedBy" TEXT,
    ADD COLUMN "escalationNote" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_organizationId_name_key" ON "CustomRole"("organizationId", "name");

-- CreateIndex
CREATE INDEX "CustomRole_organizationId_idx" ON "CustomRole"("organizationId");

-- CreateIndex
CREATE INDEX "CustomRole_isActive_idx" ON "CustomRole"("isActive");

-- CreateIndex
CREATE INDEX "UserRole_customRoleId_idx" ON "UserRole"("customRoleId");

-- CreateIndex
CREATE INDEX "Ticket_escalatedToRoleId_idx" ON "Ticket"("escalatedToRoleId");

-- CreateIndex
CREATE INDEX "Ticket_escalatedToSystemRole_idx" ON "Ticket"("escalatedToSystemRole");

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_escalatedBy_fkey" FOREIGN KEY ("escalatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_escalatedToRoleId_fkey" FOREIGN KEY ("escalatedToRoleId") REFERENCES "CustomRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

