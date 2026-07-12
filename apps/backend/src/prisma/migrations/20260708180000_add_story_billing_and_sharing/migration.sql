-- Add the locale preference that already exists in the Prisma model.
ALTER TABLE "User" ADD COLUMN "appLocale" TEXT DEFAULT 'en';

-- Community stories expire automatically at the application layer.
CREATE TABLE "Story" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "caption" TEXT,
  "placeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Story_userId_expiresAt_idx" ON "Story"("userId", "expiresAt");
CREATE INDEX "Story_placeId_idx" ON "Story"("placeId");
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- External bank transfers are orders only; payment confirmation is performed by
-- the signed SePay webhook before a PremiumGrant is created.
CREATE TABLE "BankTransferOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planCode" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "transferContent" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "paidAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BankTransferOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BankTransferOrder_transferContent_key"
  ON "BankTransferOrder"("transferContent");
CREATE INDEX "BankTransferOrder_userId_status_idx"
  ON "BankTransferOrder"("userId", "status");
CREATE INDEX "BankTransferOrder_transferContent_idx"
  ON "BankTransferOrder"("transferContent");
ALTER TABLE "BankTransferOrder" ADD CONSTRAINT "BankTransferOrder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PremiumGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PremiumGrant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PremiumGrant_userId_expiresAt_idx"
  ON "PremiumGrant"("userId", "expiresAt");
ALTER TABLE "PremiumGrant" ADD CONSTRAINT "PremiumGrant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SharedBudget" (
  "id" TEXT NOT NULL,
  "budgetId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'viewer',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SharedBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SharedBudget_budgetId_userId_key"
  ON "SharedBudget"("budgetId", "userId");
CREATE INDEX "SharedBudget_userId_idx" ON "SharedBudget"("userId");
ALTER TABLE "SharedBudget" ADD CONSTRAINT "SharedBudget_budgetId_fkey"
  FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SharedBudget" ADD CONSTRAINT "SharedBudget_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SharedItinerary" (
  "id" TEXT NOT NULL,
  "itineraryId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'viewer',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SharedItinerary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SharedItinerary_itineraryId_userId_key"
  ON "SharedItinerary"("itineraryId", "userId");
CREATE INDEX "SharedItinerary_userId_idx" ON "SharedItinerary"("userId");
ALTER TABLE "SharedItinerary" ADD CONSTRAINT "SharedItinerary_itineraryId_fkey"
  FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SharedItinerary" ADD CONSTRAINT "SharedItinerary_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
