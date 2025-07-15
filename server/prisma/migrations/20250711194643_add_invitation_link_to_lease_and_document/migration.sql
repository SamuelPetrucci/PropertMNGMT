-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lease_agreements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "unitId" INTEGER,
    "rentAmount" REAL NOT NULL,
    "securityDeposit" REAL,
    "leaseStartDate" TEXT NOT NULL,
    "leaseEndDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lateFeeAmount" REAL,
    "gracePeriodDays" INTEGER,
    "utilitiesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "petPolicy" TEXT,
    "parkingSpaces" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "invitationId" INTEGER,
    CONSTRAINT "lease_agreements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lease_agreements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lease_agreements_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lease_agreements_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_lease_agreements" ("createdAt", "gracePeriodDays", "id", "lateFeeAmount", "leaseEndDate", "leaseStartDate", "parkingSpaces", "petPolicy", "propertyId", "rentAmount", "securityDeposit", "status", "tenantId", "unitId", "updatedAt", "utilitiesIncluded") SELECT "createdAt", "gracePeriodDays", "id", "lateFeeAmount", "leaseEndDate", "leaseStartDate", "parkingSpaces", "petPolicy", "propertyId", "rentAmount", "securityDeposit", "status", "tenantId", "unitId", "updatedAt", "utilitiesIncluded" FROM "lease_agreements";
DROP TABLE "lease_agreements";
ALTER TABLE "new_lease_agreements" RENAME TO "lease_agreements";
CREATE TABLE "new_tenant_documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" INTEGER NOT NULL,
    "leaseId" INTEGER,
    "invitationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tenant_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tenant_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tenant_documents_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease_agreements" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tenant_documents_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tenant_documents" ("createdAt", "fileUrl", "filename", "id", "leaseId", "tenantId", "type", "updatedAt", "uploadedBy") SELECT "createdAt", "fileUrl", "filename", "id", "leaseId", "tenantId", "type", "updatedAt", "uploadedBy" FROM "tenant_documents";
DROP TABLE "tenant_documents";
ALTER TABLE "new_tenant_documents" RENAME TO "tenant_documents";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
