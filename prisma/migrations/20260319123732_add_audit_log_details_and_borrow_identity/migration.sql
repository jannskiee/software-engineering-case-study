-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorRole" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "details" TEXT;

-- AlterTable
ALTER TABLE "BorrowRequest" ADD COLUMN     "studentName" TEXT,
ADD COLUMN     "studentSchoolId" TEXT;
