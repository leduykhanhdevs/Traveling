-- AlterTable
ALTER TABLE "BankTransferOrder" ADD COLUMN "providerTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BankTransferOrder_providerTransactionId_key" ON "BankTransferOrder"("providerTransactionId");
