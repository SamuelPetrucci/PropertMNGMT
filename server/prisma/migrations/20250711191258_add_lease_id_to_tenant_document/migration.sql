-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tenant_documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" INTEGER NOT NULL,
    "leaseId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tenant_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tenant_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tenant_documents_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease_agreements" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tenant_documents" ("createdAt", "fileUrl", "filename", "id", "tenantId", "type", "updatedAt", "uploadedBy") SELECT "createdAt", "fileUrl", "filename", "id", "tenantId", "type", "updatedAt", "uploadedBy" FROM "tenant_documents";
DROP TABLE "tenant_documents";
ALTER TABLE "new_tenant_documents" RENAME TO "tenant_documents";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
