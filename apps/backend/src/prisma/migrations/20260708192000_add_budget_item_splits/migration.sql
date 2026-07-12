-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN "paidById" TEXT;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "BudgetItemSplit" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BudgetItemSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItemSplit_itemId_userId_key" ON "BudgetItemSplit"("itemId", "userId");

-- CreateIndex
CREATE INDEX "BudgetItemSplit_userId_idx" ON "BudgetItemSplit"("userId");

-- AddForeignKey
ALTER TABLE "BudgetItemSplit" ADD CONSTRAINT "BudgetItemSplit_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BudgetItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItemSplit" ADD CONSTRAINT "BudgetItemSplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
