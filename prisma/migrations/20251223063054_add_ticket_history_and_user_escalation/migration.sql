-- CreateEnum
CREATE TYPE "TicketHistoryType" AS ENUM ('CREATED', 'ASSIGNED', 'UNASSIGNED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ESCALATED', 'TRANSFERRED', 'COMMENT_ADDED');

-- AlterTable
ALTER TABLE "Ticket" 
    ADD COLUMN "escalatedToUserId" TEXT;

-- CreateTable
CREATE TABLE "TicketHistory" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "type" "TicketHistoryType" NOT NULL,
    "userId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketHistory_pkey" PRIMARY KEY ("id")
);

-- AlterEnum (only if enum exists - check first)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditEventType') THEN
        -- Try to add values, ignore if they already exist
        BEGIN
            ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TICKET_UNASSIGNED';
        EXCEPTION WHEN OTHERS THEN
            -- Value might already exist, ignore
        END;
        BEGIN
            ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TICKET_ESCALATED';
        EXCEPTION WHEN OTHERS THEN
            -- Value might already exist, ignore
        END;
        BEGIN
            ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TICKET_TRANSFERRED';
        EXCEPTION WHEN OTHERS THEN
            -- Value might already exist, ignore
        END;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX "Ticket_escalatedToUserId_idx" ON "Ticket"("escalatedToUserId");

-- CreateIndex
CREATE INDEX "TicketHistory_ticketId_idx" ON "TicketHistory"("ticketId");

-- CreateIndex
CREATE INDEX "TicketHistory_userId_idx" ON "TicketHistory"("userId");

-- CreateIndex
CREATE INDEX "TicketHistory_type_idx" ON "TicketHistory"("type");

-- CreateIndex
CREATE INDEX "TicketHistory_createdAt_idx" ON "TicketHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_escalatedToUserId_fkey" FOREIGN KEY ("escalatedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketHistory" ADD CONSTRAINT "TicketHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketHistory" ADD CONSTRAINT "TicketHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

