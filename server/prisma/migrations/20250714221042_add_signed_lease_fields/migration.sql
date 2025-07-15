-- AlterTable
ALTER TABLE "tenant_documents" ADD COLUMN "signedAt" DATETIME;
ALTER TABLE "tenant_documents" ADD COLUMN "signedByTenant" BOOLEAN DEFAULT false;
ALTER TABLE "tenant_documents" ADD COLUMN "signedLeaseFileUrl" TEXT;
