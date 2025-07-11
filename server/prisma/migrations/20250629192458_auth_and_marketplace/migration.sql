/*
  Warnings:

  - You are about to drop the `tenant_contacts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `date` on the `project_costs` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `project_costs` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `project_costs` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `project_costs` table. All the data in the column will be lost.
  - You are about to drop the column `actualCost` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `completedDate` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedCost` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `project_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `budget` on the `standalone_projects` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `project_costs` table without a default value. This is not possible if the table is not empty.
  - Made the column `projectId` on table `project_costs` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `label` to the `project_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `organizationId` to the `work_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tenant_contacts";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "organizations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "website" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "businessLicense" TEXT,
    "taxId" TEXT,
    "verifiedAt" DATETIME,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "billingEmail" TEXT,
    "paymentMethod" TEXT,
    "settings" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "contractors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "businessAddress" TEXT,
    "businessLicense" TEXT,
    "insuranceInfo" TEXT,
    "specialties" TEXT,
    "serviceAreas" TEXT,
    "hourlyRate" REAL,
    "availability" TEXT,
    "minimumJobAmount" REAL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rating" REAL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "profileImage" TEXT,
    "portfolioImages" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contractors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contractor_reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractorId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "jobType" TEXT,
    "jobAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contractor_reviews_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contractor_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contractor_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_invitations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "unitId" INTEGER,
    "invitedById" INTEGER NOT NULL,
    "invitationToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rentAmount" REAL,
    "leaseStartDate" TEXT,
    "leaseEndDate" TEXT,
    "securityDeposit" REAL,
    "leaseTerms" TEXT,
    "acceptedAt" DATETIME,
    "acceptedByUserId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tenant_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tenant_invitations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tenant_invitations_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tenant_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tenant_invitations_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contractor_assignments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractorId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedProperties" TEXT,
    "rateAgreement" REAL,
    "paymentTerms" TEXT,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByUserId" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contractor_assignments_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contractor_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contractor_assignments_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenantId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "unitId" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" TEXT NOT NULL,
    "paidDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "dueDate", "id", "method", "paidDate", "propertyId", "status", "tenantId", "unitId", "updatedAt") SELECT "amount", "createdAt", "dueDate", "id", "method", "paidDate", "propertyId", "status", "tenantId", "unitId", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE TABLE "new_project_costs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_costs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "standalone_projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_project_costs" ("amount", "createdAt", "id", "projectId", "type", "updatedAt") SELECT "amount", "createdAt", "id", "projectId", "type", "updatedAt" FROM "project_costs";
DROP TABLE "project_costs";
ALTER TABLE "new_project_costs" RENAME TO "project_costs";
CREATE TABLE "new_project_jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "materialCost" REAL,
    "laborCost" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
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
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "valuation" REAL,
    "organizationId" INTEGER NOT NULL,
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
    CONSTRAINT "properties_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_properties" ("address", "createdAt", "id", "mortgageAmount", "mortgageLender", "mortgagePayment", "mortgageRate", "mortgageStartDate", "mortgageTerm", "name", "ownerId", "taxRate", "type", "updatedAt", "valuation") SELECT "address", "createdAt", "id", "mortgageAmount", "mortgageLender", "mortgagePayment", "mortgageRate", "mortgageStartDate", "mortgageTerm", "name", "ownerId", "taxRate", "type", "updatedAt", "valuation" FROM "properties";
DROP TABLE "properties";
ALTER TABLE "new_properties" RENAME TO "properties";
CREATE TABLE "new_standalone_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "standalone_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_standalone_projects" ("createdAt", "description", "endDate", "id", "name", "ownerId", "startDate", "status", "updatedAt") SELECT "createdAt", "description", "endDate", "id", "name", "ownerId", "startDate", "status", "updatedAt" FROM "standalone_projects";
DROP TABLE "standalone_projects";
ALTER TABLE "new_standalone_projects" RENAME TO "standalone_projects";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerifiedAt" DATETIME,
    "organizationId" INTEGER,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "dateOfBirth" TEXT,
    "ssn" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" DATETIME,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "dateOfBirth", "email", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelation", "firstName", "id", "lastName", "phone", "role", "ssn", "updatedAt") SELECT "createdAt", "dateOfBirth", "email", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelation", "firstName", "id", "lastName", "phone", "role", "ssn", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
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
    "contractorId" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_orders_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_tenantUnitId_fkey" FOREIGN KEY ("tenantUnitId") REFERENCES "tenant_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_work_orders" ("assignedToId", "createdAt", "createdById", "description", "id", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt") SELECT "assignedToId", "createdAt", "createdById", "description", "id", "priority", "propertyId", "status", "tenantUnitId", "title", "unitId", "updatedAt" FROM "work_orders";
DROP TABLE "work_orders";
ALTER TABLE "new_work_orders" RENAME TO "work_orders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contractors_userId_key" ON "contractors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_invitations_invitationToken_key" ON "tenant_invitations"("invitationToken");

-- CreateIndex
CREATE UNIQUE INDEX "contractor_assignments_contractorId_organizationId_key" ON "contractor_assignments"("contractorId", "organizationId");
