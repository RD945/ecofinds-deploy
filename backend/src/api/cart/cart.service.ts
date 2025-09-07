import { prisma } from '../../lib/prisma';

export async function getCart(userId: number) {
  return prisma.cartItem.findMany({
    where: { user_id: userId },
    include: { 
      product: {
        include: {
          images: {
            select: {
              id: true,
              url: true,
              mimetype: true,
            }
          }
        }
      }
    },
  });
}

export async function addItemToCart(userId: number, productId: number, quantity: number) {
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      user_id_product_id: {
        user_id: userId,
        product_id: productId,
      },
    },
  });

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  }

  return prisma.cartItem.create({
    data: {
      user_id: userId,
      product_id: productId,
      quantity,
    },
  });
}

export async function removeItemFromCart(userId: number, productId: number) {
  return prisma.cartItem.delete({
    where: {
      user_id_product_id: {
        user_id: userId,
        product_id: productId,
      },
    },
  });
}

export async function clearCart(userId: number) {
    return prisma.cartItem.deleteMany({
        where: { user_id: userId }
    });
}
