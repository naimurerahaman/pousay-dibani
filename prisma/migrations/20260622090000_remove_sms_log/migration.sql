-- DropForeignKey
ALTER TABLE "SmsLog" DROP CONSTRAINT "SmsLog_orderId_fkey";

-- DropTable
DROP TABLE "SmsLog";

-- DropEnum
DROP TYPE "SmsStatus";
