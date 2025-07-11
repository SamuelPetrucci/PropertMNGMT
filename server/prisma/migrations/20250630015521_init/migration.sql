/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `work_orders` table. All the data in the column will be lost.
  - Added the required column `ownerId` to the `standalone_projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `work_orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LANDLORD',
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
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
    CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_properties" ("address", "createdAt", "id", "mortgageAmount", "mortgageLender", "mortgagePayment", "mortgageRate", "mortgageStartDate", "mortgageTerm", "name", "ownerId", "taxRate", "type", "updatedAt", "valuation") SELECT "address", "createdAt", "id", "mortgageAmount", "mortgageLender", "mortgagePayment", "mortgageRate", "mortgageStartDate", "mortgageTerm", "name", "ownerId", "taxRate", "type", "updatedAt", "valuation" FROM "properties";
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
    CONSTRAINT "standalone_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_standalone_projects" ("budget", "createdAt", "description", "endDate", "id", "location", "name", "startDate", "status", "updatedAt") SELECT "budget", "createdAt", "description", "endDate", "id", "location", "name", "startDate", "status", "updatedAt" FROM "standalone_projects";
DROP TABLE "standalone_projects";
ALTER TABLE "new_standalone_projects" RENAME TO "standalone_projects";
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
    CONSTRAINT "tenant_units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_orders_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_tenantUnitId_fkey" FOREIGN KEY ("tenantUnitId") REFERENCES "tenant_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_work_orders" ("createdAt", "description", "id", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt") SELECT "createdAt", "description", "id", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt" FROM "work_orders";
DROP TABLE "work_orders";
ALTER TABLE "new_work_orders" RENAME TO "work_orders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
