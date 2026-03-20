-- AlterTable
ALTER TABLE "BorrowRequest" ADD COLUMN     "dispatchedToId" TEXT,
ADD COLUMN     "dispatchedToName" TEXT,
ADD COLUMN     "returnedById" TEXT,
ADD COLUMN     "returnedByName" TEXT;
