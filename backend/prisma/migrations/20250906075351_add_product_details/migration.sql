-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "condition" TEXT NOT NULL DEFAULT 'Used',
ADD COLUMN     "dimension_h" DECIMAL(10,2),
ADD COLUMN     "dimension_l" DECIMAL(10,2),
ADD COLUMN     "dimension_w" DECIMAL(10,2),
ADD COLUMN     "has_manual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_original" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "working_condition" TEXT,
ADD COLUMN     "year_of_manufacture" INTEGER;
