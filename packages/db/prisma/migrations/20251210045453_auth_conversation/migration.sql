-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "organization_id" TEXT;

-- CreateIndex
CREATE INDEX "idx_conversations_organization_id" ON "conversations"("organization_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
