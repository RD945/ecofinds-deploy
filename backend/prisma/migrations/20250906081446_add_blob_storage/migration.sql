-- AlterTable
ALTER TABLE "public"."ProductImage" ADD COLUMN     "imageData" BYTEA,
ADD COLUMN     "mimetype" TEXT,
ALTER COLUMN "url" DROP NOT NULL;
