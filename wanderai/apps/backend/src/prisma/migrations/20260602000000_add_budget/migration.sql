CREATE TABLE "Budget" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tripName" TEXT NOT NULL,
  "totalBudget" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BudgetItem" (
  "id" TEXT NOT NULL,
  "budgetId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Budget_userId_createdAt_idx" ON "Budget"("userId", "createdAt");
CREATE INDEX "BudgetItem_budgetId_date_idx" ON "BudgetItem"("budgetId", "date");
CREATE INDEX "BudgetItem_category_idx" ON "BudgetItem"("category");

ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
