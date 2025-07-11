/*
  Warnings:

  - You are about to drop the `contractor_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contractor_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contractors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tenant_invitations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `organizationId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `project_costs` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerifiedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `loginCount` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetExpires` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `contractorId` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `work_orders` table. All the data in the column will be lost.
  - Added the required column `name` to the `project_costs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `project_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "contractor_assignments_contractorId_organizationId_key";

-- DropIndex
DROP INDEX "contractors_userId_key";

-- DropIndex
DROP INDEX "organizations_email_key";

-- DropIndex
DROP INDEX "tenant_invitations_invitationToken_key";

-- AlterTable
ALTER TABLE "standalone_projects" ADD COLUMN "budget" REAL;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "contractor_assignments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "contractor_reviews";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "contractors";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "organizations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tenant_invitations";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "tenant_contacts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tenant_contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
CREATE TABLE "new_project_costs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER,
    "jobId" INTEGER,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_costs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "standalone_projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "project_costs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "project_jobs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_project_costs" ("amount", "createdAt", "id", "projectId", "type", "updatedAt") SELECT "amount", "createdAt", "id", "projectId", "type", "updatedAt" FROM "project_costs";
DROP TABLE "project_costs";
ALTER TABLE "new_project_costs" RENAME TO "project_costs";
CREATE TABLE "new_project_jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedCost" REAL,
    "laborCost" REAL,
    "materialCost" REAL,
    "actualCost" REAL,
    "dueDate" DATETIME,
    "completedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "standalone_projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_project_jobs" ("createdAt", "description", "id", "laborCost", "materialCost", "projectId", "status", "updatedAt") SELECT "createdAt", "description", "id", "laborCost", "materialCost", "projectId", "status", "updatedAt" FROM "project_jobs";
DROP TABLE "project_jobs";
ALTER TABLE "new_project_jobs" RENAME TO "project_jobs";
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
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LANDLORD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TEXT,
    "ssn" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT
);
INSERT INTO "new_users" ("createdAt", "dateOfBirth", "email", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelation", "firstName", "id", "lastName", "phone", "role", "ssn", "updatedAt") SELECT "createdAt", "dateOfBirth", "email", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelation", "firstName", "id", "lastName", "phone", "role", "ssn", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
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
INSERT INTO "new_work_orders" ("assignedToId", "createdAt", "createdById", "description", "id", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt") SELECT "assignedToId", "createdAt", "createdById", "description", "id", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt" FROM "work_orders";
DROP TABLE "work_orders";
ALTER TABLE "new_work_orders" RENAME TO "work_orders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
