import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getProducts(category?: string, search?: string) {
    const where: Prisma.ProductWhereInput = {};
    if (category) {
        where.category = { name: category };
    }
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

  return prisma.product.findMany({
      where,
      include: {
          category: true,
          seller: {
              select: {
                  id: true,
                  username: true,
              }
          },
          images: {
              take: 1,
              select: {
                  id: true,
                  url: true,
              }
          },
      },
      orderBy: {
          created_at: 'desc',
      },
    });
}

export async function getProductById(id: number) {
  return prisma.product.findUnique({ 
      where: { id },
      include: {
          category: true,
          seller: {
              select: {
                  id: true,
                  username: true,
              }
          },
          images: true,
      }
    });
}

export async function createProduct(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ 
      data,
      include: {
          category: true,
      }
    });
}

export async function updateProduct(
  id: number,
  sellerId: number,
  data: Prisma.ProductUpdateInput,
  newImages: Express.Multer.File[],
  existingImageIds: number[]
) {
  // First, verify the product exists and belongs to the seller
  const product = await prisma.product.findFirst({
    where: { id, seller_id: sellerId },
    include: { images: true }
  });

  if (!product) {
    throw new Error('Product not found or seller mismatch');
  }

  // Determine which images to delete
  const imagesToDelete = product.images.filter(img => !existingImageIds.includes(img.id));

  const updateData: Prisma.ProductUpdateInput = { ...data };

  // Prepare new images for creation
  if (newImages && newImages.length > 0) {
    updateData.images = {
      create: newImages.map(file => ({
        imageData: file.buffer,
        mimetype: file.mimetype,
      })),
    };
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  // Delete the images that were removed
  if (imagesToDelete.length > 0) {
    await prisma.productImage.deleteMany({
      where: {
        id: {
          in: imagesToDelete.map(img => img.id),
        },
      },
    });
  }

  return updatedProduct;
}


export async function deleteProduct(id: number, sellerId: number) {
  // First, verify the product exists and belongs to the seller before deleting
  const product = await prisma.product.findFirst({
    where: { id, seller_id: sellerId },
    include: { images: true }
  });

  if (!product) {
    throw new Error('Product not found or seller mismatch');
  }

  // Delete the product
  await prisma.product.delete({ where: { id } });

  // Delete the associated images
  if (product.images.length > 0) {
    await prisma.productImage.deleteMany({
      where: {
        id: {
          in: product.images.map(img => img.id),
        },
      },
    });
  }
}
