import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCategories() {
    return prisma.category.findMany();
}
