/*
  Warnings:

  - You are about to drop the `invitations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `invitationId` on the `lease_agreements` table. All the data in the column will be lost.
  - You are about to drop the column `invitationId` on the `tenant_documents` table. All the data in the column will be lost.
  - You are about to drop the column `leaseId` on the `tenant_documents` table. All the data in the column will be lost.
  - You are about to drop the column `signedAt` on the `tenant_documents` table. All the data in the column will be lost.
  - You are about to drop the column `signedByTenant` on the `tenant_documents` table. All the data in the column will be lost.
  - You are about to drop the column `signedLeaseFileUrl` on the `tenant_documents` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "invitations_token_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "invitations";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_communications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MESSAGE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "relatedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "communications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communications_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_communications" ("createdAt", "id", "message", "priority", "receiverId", "relatedTo", "senderId", "status", "subject", "type", "updatedAt") SELECT "createdAt", "id", "message", "priority", "receiverId", "relatedTo", "senderId", "status", "subject", "type", "updatedAt" FROM "communications";
DROP TABLE "communications";
ALTER TABLE "new_communications" RENAME TO "communications";
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
    CONSTRAINT "lease_agreements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lease_agreements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lease_agreements_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_lease_agreements" ("createdAt", "gracePeriodDays", "id", "lateFeeAmount", "leaseEndDate", "leaseStartDate", "parkingSpaces", "petPolicy", "propertyId", "rentAmount", "securityDeposit", "status", "tenantId", "unitId", "updatedAt", "utilitiesIncluded") SELECT "createdAt", "gracePeriodDays", "id", "lateFeeAmount", "leaseEndDate", "leaseStartDate", "parkingSpaces", "petPolicy", "propertyId", "rentAmount", "securityDeposit", "status", "tenantId", "unitId", "updatedAt", "utilitiesIncluded" FROM "lease_agreements";
DROP TABLE "lease_agreements";
ALTER TABLE "new_lease_agreements" RENAME TO "lease_agreements";
CREATE TABLE "new_maintenance_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "unitId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "images" TEXT,
    "workOrderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "maintenance_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_requests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "maintenance_requests_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_maintenance_requests" ("category", "createdAt", "description", "id", "images", "priority", "propertyId", "status", "tenantId", "title", "unitId", "updatedAt", "workOrderId") SELECT "category", "createdAt", "description", "id", "images", "priority", "propertyId", "status", "tenantId", "title", "unitId", "updatedAt", "workOrderId" FROM "maintenance_requests";
DROP TABLE "maintenance_requests";
ALTER TABLE "new_maintenance_requests" RENAME TO "maintenance_requests";
CREATE UNIQUE INDEX "maintenance_requests_workOrderId_key" ON "maintenance_requests"("workOrderId");
CREATE TABLE "new_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "unitId" INTEGER,
    "amount" REAL NOT NULL,
    "dueDate" TEXT NOT NULL,
    "paidDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "dueDate", "id", "method", "paidDate", "propertyId", "status", "tenantId", "unitId", "updatedAt") SELECT "amount", "createdAt", "dueDate", "id", "method", "paidDate", "propertyId", "status", "tenantId", "unitId", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE TABLE "new_properties" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "valuation" REAL,
    "ownerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mortgageAmount" REAL,
    "mortgagePayment" REAL,
    "mortgageLender" TEXT,
    "mortgageRate" REAL,
    "mortgageTerm" INTEGER,
    "mortgageStartDate" TEXT,
    "taxRate" TEXT,
    "rent" REAL,
    CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_properties" ("address", "createdAt", "id", "mortgageAmount", "mortgageLender", "mortgagePayment", "mortgageRate", "mortgageStartDate", "mortgageTerm", "name", "ownerId", "rent", "taxRate", "type", "updatedAt", "valuation") SELECT "address", "createdAt", "id", "mortgageAmount", "mortgageLender", "mortgagePayment", "mortgageRate", "mortgageStartDate", "mortgageTerm", "name", "ownerId", "rent", "taxRate", "type", "updatedAt", "valuation" FROM "properties";
DROP TABLE "properties";
ALTER TABLE "new_properties" RENAME TO "properties";
CREATE TABLE "new_standalone_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" REAL,
    "location" TEXT,
    "ownerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "standalone_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_standalone_projects" ("budget", "createdAt", "description", "endDate", "id", "location", "name", "ownerId", "startDate", "status", "updatedAt") SELECT "budget", "createdAt", "description", "endDate", "id", "location", "name", "ownerId", "startDate", "status", "updatedAt" FROM "standalone_projects";
DROP TABLE "standalone_projects";
ALTER TABLE "new_standalone_projects" RENAME TO "standalone_projects";
CREATE TABLE "new_tenant_documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tenant_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tenant_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tenant_documents" ("createdAt", "fileUrl", "filename", "id", "tenantId", "type", "updatedAt", "uploadedBy") SELECT "createdAt", "fileUrl", "filename", "id", "tenantId", "type", "updatedAt", "uploadedBy" FROM "tenant_documents";
DROP TABLE "tenant_documents";
ALTER TABLE "new_tenant_documents" RENAME TO "tenant_documents";
CREATE TABLE "new_tenant_units" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "unitId" INTEGER,
    "propertyId" INTEGER NOT NULL,
    "rent" REAL,
    "tenantName" TEXT,
    "leaseStart" TEXT,
    "leaseEnd" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tenant_units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tenant_units_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tenant_units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tenant_units" ("createdAt", "id", "leaseEnd", "leaseStart", "propertyId", "rent", "tenantId", "tenantName", "unitId", "updatedAt") SELECT "createdAt", "id", "leaseEnd", "leaseStart", "propertyId", "rent", "tenantId", "tenantName", "unitId", "updatedAt" FROM "tenant_units";
DROP TABLE "tenant_units";
ALTER TABLE "new_tenant_units" RENAME TO "tenant_units";
CREATE TABLE "new_work_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "propertyId" INTEGER NOT NULL,
    "unitId" INTEGER,
    "tenantUnitId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_orders_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_tenantUnitId_fkey" FOREIGN KEY ("tenantUnitId") REFERENCES "tenant_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_work_orders" ("assignedToId", "createdAt", "createdById", "description", "id", "notes", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt") SELECT "assignedToId", "createdAt", "createdById", "description", "id", "notes", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt" FROM "work_orders";
DROP TABLE "work_orders";
ALTER TABLE "new_work_orders" RENAME TO "work_orders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
