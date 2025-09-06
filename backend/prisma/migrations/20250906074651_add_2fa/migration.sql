-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_expires_at" TIMESTAMP(3),
ADD COLUMN     "two_factor_secret" TEXT;
