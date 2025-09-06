import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase(req: Request, res: Response) {
  try {
    // Clear existing data (be careful!)
    await prisma.orderItem.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();

    // Create categories
    const categories = await prisma.category.createMany({
      data: [
        { name: 'Electronics' },
        { name: 'Clothing' },
        { name: 'Home & Garden' },
        { name: 'Books' },
        { name: 'Sports' },
      ],
    });

    // Get created categories
    const electronicsCategory = await prisma.category.findFirst({ where: { name: 'Electronics' } });
    const clothingCategory = await prisma.category.findFirst({ where: { name: 'Clothing' } });
    const homeCategory = await prisma.category.findFirst({ where: { name: 'Home & Garden' } });

    // Create sample user
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@ecofinds.com',
        password_hash: '$2b$10$8K1p/a0dUrM/MKfUQd4CkeQNKoMG6VLV5z0g8/8X8KG.hKEQMG0Du', // password: admin123
        two_factor_enabled: false,
      },
    });

    // Create sample products
    const products = [
      {
        title: 'Eco-Friendly Laptop',
        description: 'Refurbished laptop made from sustainable materials',
        price: 599.99,
        category_id: electronicsCategory!.id,
        seller_id: user.id,
        quantity: 5,
        condition: 'Excellent',
        brand: 'EcoTech',
      },
      {
        title: 'Organic Cotton T-Shirt',
        description: 'Comfortable organic cotton t-shirt',
        price: 29.99,
        category_id: clothingCategory!.id,
        seller_id: user.id,
        quantity: 20,
        condition: 'New',
        brand: 'EcoWear',
      },
      {
        title: 'Bamboo Plant Pot',
        description: 'Sustainable bamboo plant pot for your garden',
        price: 15.99,
        category_id: homeCategory!.id,
        seller_id: user.id,
        quantity: 10,
        condition: 'New',
        brand: 'GreenHome',
      },
    ];

    for (const productData of products) {
      await prisma.product.create({
        data: productData,
      });
    }

    res.json({ 
      message: 'Database seeded successfully!',
      categories: categories.count,
      products: products.length,
      users: 1
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Failed to seed database', error: error });
  }
}
