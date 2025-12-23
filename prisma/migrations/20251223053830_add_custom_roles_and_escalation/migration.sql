-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "CustomRole" (
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

-- AlterTable UserRole (add customRoleId if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'UserRole' AND column_name = 'customRoleId') THEN
        ALTER TABLE "UserRole" ADD COLUMN "customRoleId" TEXT;
    END IF;
    
    -- Make roleId nullable if it's not already
    ALTER TABLE "UserRole" ALTER COLUMN "roleId" DROP NOT NULL;
END $$;

-- AlterTable Ticket (add escalation columns if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ticket' AND column_name = 'escalatedToRoleId') THEN
        ALTER TABLE "Ticket" ADD COLUMN "escalatedToRoleId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ticket' AND column_name = 'escalatedToSystemRole') THEN
        ALTER TABLE "Ticket" ADD COLUMN "escalatedToSystemRole" "RoleName";
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ticket' AND column_name = 'escalatedAt') THEN
        ALTER TABLE "Ticket" ADD COLUMN "escalatedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ticket' AND column_name = 'escalatedBy') THEN
        ALTER TABLE "Ticket" ADD COLUMN "escalatedBy" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ticket' AND column_name = 'escalationNote') THEN
        ALTER TABLE "Ticket" ADD COLUMN "escalationNote" TEXT;
    END IF;
END $$;

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "CustomRole_organizationId_name_key" ON "CustomRole"("organizationId", "name");

CREATE INDEX IF NOT EXISTS "CustomRole_organizationId_idx" ON "CustomRole"("organizationId");

CREATE INDEX IF NOT EXISTS "CustomRole_isActive_idx" ON "CustomRole"("isActive");

CREATE INDEX IF NOT EXISTS "UserRole_customRoleId_idx" ON "UserRole"("customRoleId");

CREATE INDEX IF NOT EXISTS "Ticket_escalatedToRoleId_idx" ON "Ticket"("escalatedToRoleId");

CREATE INDEX IF NOT EXISTS "Ticket_escalatedToSystemRole_idx" ON "Ticket"("escalatedToSystemRole");

-- AddForeignKey (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'CustomRole_organizationId_fkey'
    ) THEN
        ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_organizationId_fkey" 
            FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserRole_customRoleId_fkey'
    ) THEN
        ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_customRoleId_fkey" 
            FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Ticket_escalatedBy_fkey'
    ) THEN
        ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_escalatedBy_fkey" 
            FOREIGN KEY ("escalatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Ticket_escalatedToRoleId_fkey'
    ) THEN
        ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_escalatedToRoleId_fkey" 
            FOREIGN KEY ("escalatedToRoleId") REFERENCES "CustomRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

