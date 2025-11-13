-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "clientOverview" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "paymentVerified" BOOLEAN NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "jobsPosted" INTEGER,
    "hireRate" DOUBLE PRECISION,
    "totalSpent" DOUBLE PRECISION,
    "hires" INTEGER,
    "activeJobs" INTEGER,
    "avgHourlyRate" DOUBLE PRECISION,
    "totalHours" INTEGER,
    "memberSince" TEXT,
    "aiMatchScore" DOUBLE PRECISION NOT NULL,
    "fitBucket" TEXT NOT NULL,
    "fitReason" TEXT NOT NULL,
    "category" TEXT,
    "subCategory" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);
