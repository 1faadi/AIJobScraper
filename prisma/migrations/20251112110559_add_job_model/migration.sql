/*
  Warnings:

  - You are about to drop the `jobs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FitBucket" AS ENUM ('NOT_FIT', 'P70_PERCENT', 'BEST_FIT');

-- DropTable
DROP TABLE "public"."jobs";

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "clientDetailsRaw" TEXT NOT NULL,
    "skillsRaw" TEXT NOT NULL,
    "clientCountry" TEXT NOT NULL,
    "paymentVerified" BOOLEAN NOT NULL,
    "clientRating" DOUBLE PRECISION NOT NULL,
    "jobsPosted" INTEGER,
    "hireRate" DOUBLE PRECISION,
    "totalSpent" DOUBLE PRECISION,
    "hires" INTEGER,
    "activeJobs" INTEGER,
    "avgHourlyPaid" DOUBLE PRECISION,
    "totalHours" INTEGER,
    "memberSince" TEXT,
    "aiMatchPercent" DOUBLE PRECISION,
    "bucket" "FitBucket" NOT NULL,
    "reasonsNotes" TEXT,
    "category" TEXT,
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_clientCountry_idx" ON "Job"("clientCountry");

-- CreateIndex
CREATE INDEX "Job_bucket_idx" ON "Job"("bucket");
