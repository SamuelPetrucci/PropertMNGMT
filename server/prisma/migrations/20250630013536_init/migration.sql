/*
  Warnings:

  - You are about to drop the `lease_agreements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tenant_contacts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_order_notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `name` on the `project_costs` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `project_costs` table. All the data in the column will be lost.
  - You are about to drop the column `completedDate` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `laborCost` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `materialCost` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `project_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `laborCost` on the `project_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `materialCost` on the `project_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `standalone_projects` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToId` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `work_orders` table. All the data in the column will be lost.
  - Added the required column `description` to the `project_costs` table without a default value. This is not possible if the table is not empty.
  - Made the column `projectId` on table `project_costs` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `project_tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "budget" REAL;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "lease_agreements";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tenant_contacts";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "users";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "work_order_notes";
PRAGMA foreign_keys=on;

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
    CONSTRAINT "payments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "dueDate", "id", "method", "paidDate", "propertyId", "status", "tenantId", "unitId", "updatedAt") SELECT "amount", "createdAt", "dueDate", "id", "method", "paidDate", "propertyId", "status", "tenantId", "unitId", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE TABLE "new_project_costs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "jobId" INTEGER,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MATERIAL',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_costs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "standalone_projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_project_costs" ("amount", "createdAt", "date", "id", "jobId", "projectId", "type", "updatedAt") SELECT "amount", "createdAt", "date", "id", "jobId", "projectId", "type", "updatedAt" FROM "project_costs";
DROP TABLE "project_costs";
ALTER TABLE "new_project_costs" RENAME TO "project_costs";
CREATE TABLE "new_project_jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "assignedTo" TEXT,
    "estimatedCost" REAL,
    "actualCost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "standalone_projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_project_jobs" ("actualCost", "createdAt", "description", "estimatedCost", "id", "name", "priority", "projectId", "status", "updatedAt") SELECT "actualCost", "createdAt", "description", "estimatedCost", "id", "name", "priority", "projectId", "status", "updatedAt" FROM "project_jobs";
DROP TABLE "project_jobs";
ALTER TABLE "new_project_jobs" RENAME TO "project_jobs";
CREATE TABLE "new_project_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_project_tasks" ("createdAt", "description", "id", "projectId", "status", "updatedAt") SELECT "createdAt", "description", "id", "projectId", "status", "updatedAt" FROM "project_tasks";
DROP TABLE "project_tasks";
ALTER TABLE "new_project_tasks" RENAME TO "project_tasks";
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
    "taxRate" TEXT
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_standalone_projects" ("budget", "createdAt", "description", "endDate", "id", "name", "startDate", "status", "updatedAt") SELECT "budget", "createdAt", "description", "endDate", "id", "name", "startDate", "status", "updatedAt" FROM "standalone_projects";
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
    "createdBy" TEXT,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_orders_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_tenantUnitId_fkey" FOREIGN KEY ("tenantUnitId") REFERENCES "tenant_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_work_orders" ("createdAt", "description", "id", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt") SELECT "createdAt", "description", "id", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt" FROM "work_orders";
DROP TABLE "work_orders";
ALTER TABLE "new_work_orders" RENAME TO "work_orders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
