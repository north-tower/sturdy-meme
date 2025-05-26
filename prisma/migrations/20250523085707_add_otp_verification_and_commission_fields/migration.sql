-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "agentOtpVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customerOtpVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sales_agents" ADD COLUMN     "commissionEarned" DECIMAL(65,30) NOT NULL DEFAULT 0;
