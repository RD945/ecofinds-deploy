import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getImageById(id: number) {
    return prisma.productImage.findUnique({
        where: { id },
    });
}
