-- Remove Change Management and SLA Management

-- Drop foreign key constraints first
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_slaPolicyId_fkey";
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_relatedTicketId_fkey";

-- Drop tables
DROP TABLE IF EXISTS "ChangeApproval" CASCADE;
DROP TABLE IF EXISTS "ChangeRequest" CASCADE;
DROP TABLE IF EXISTS "EscalationRule" CASCADE;
DROP TABLE IF EXISTS "SLATracking" CASCADE;
DROP TABLE IF EXISTS "SLAPolicy" CASCADE;

-- Remove columns from Ticket
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "slaPolicyId";
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "relatedTicketId";

-- Remove enum values from NotificationType (if they exist)
-- Note: PostgreSQL doesn't support removing enum values easily, so we'll leave them
-- They won't be used but won't cause issues

-- Remove enum types (only if not used elsewhere)
-- DROP TYPE IF EXISTS "ChangeType" CASCADE;
-- DROP TYPE IF EXISTS "ChangeStatus" CASCADE;
-- DROP TYPE IF EXISTS "ChangePriority" CASCADE;
-- DROP TYPE IF EXISTS "RiskLevel" CASCADE;
-- DROP TYPE IF EXISTS "ApprovalStatus" CASCADE;


