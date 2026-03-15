DO $$
BEGIN
  CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DISPENSED', 'RETURNED', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "InventoryItem" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "totalQty" INTEGER NOT NULL DEFAULT 0,
  "availableQty" INTEGER NOT NULL DEFAULT 0,
  "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BorrowRequest" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "professorId" TEXT,
  "roomNumber" TEXT NOT NULL,
  "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
  "isGroup" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BorrowRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BorrowRequestItem" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "BorrowRequestItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GroupMember" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  "schoolIdNumber" TEXT NOT NULL,
  CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BorrowRequest_studentId_fkey'
  ) THEN
    ALTER TABLE "BorrowRequest"
      ADD CONSTRAINT "BorrowRequest_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BorrowRequest_professorId_fkey'
  ) THEN
    ALTER TABLE "BorrowRequest"
      ADD CONSTRAINT "BorrowRequest_professorId_fkey"
      FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BorrowRequestItem_requestId_fkey'
  ) THEN
    ALTER TABLE "BorrowRequestItem"
      ADD CONSTRAINT "BorrowRequestItem_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "BorrowRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BorrowRequestItem_itemId_fkey'
  ) THEN
    ALTER TABLE "BorrowRequestItem"
      ADD CONSTRAINT "BorrowRequestItem_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GroupMember_requestId_fkey'
  ) THEN
    ALTER TABLE "GroupMember"
      ADD CONSTRAINT "GroupMember_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "BorrowRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_actorId_fkey'
  ) THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

