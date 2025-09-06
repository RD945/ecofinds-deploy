import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Clearing data in the correct order to respect all foreign key constraints
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({});
  console.log('Cleared all previous data.');

  // 1. Create Categories
  const categories = [
    { name: 'kitchen' },
    { name: 'accessories' },
    { name: 'electronics' },
    { name: 'personal care' },
    { name: 'home' },
    { name: 'clothing' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  const createdCategories = await prisma.category.findMany();
  console.log('✅ Categories created.');

  // 2. Create Sample Users (Sellers)
  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@example.com' },
    update: {},
    create: {
      email: 'seller1@example.com',
      username: 'EcoSellerOne',
      password_hash: await hashPassword('password123'),
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@example.com' },
    update: {},
    create: {
      email: 'seller2@example.com',
      username: 'GreenGoodsCo',
      password_hash: await hashPassword('password123'),
    },
  });
  console.log('✅ Sample users created.');

  // 3. Create Sample Products
  const categoryMap = createdCategories.reduce((map, cat) => {
    map[cat.name] = cat.id;
    return map;
  }, {} as Record<string, number>);


  const productsToCreate = [
    // 1. Bamboo Water Bottle
    {
      product: {
        title: 'Bamboo Water Bottle',
        description: "A stylish and sustainable water bottle crafted from premium bamboo with a stainless steel inner flask. It features a double-wall vacuum insulated design to keep drinks hot or cold for hours. The bottle has a 450ml capacity and comes with a leak-proof lid and a tea strainer, making it perfect for water, coffee, or tea.\n\nWhat's in the box: Steel lid, Bamboo Bottle.\nSpecial Features: Leakproof, Lockable Lid, Double Wall Vacuum Insulated, Includes Tea Strainer.",
        price: 599.00,
        seller_id: seller1.id,
        category_id: categoryMap['kitchen'],
        quantity: 87,
        condition: 'New',
        brand: 'Gift Kya De',
        material: 'Bamboo, Stainless Steel',
        color: 'Natural Bamboo',
        is_original: true,
        has_manual: true,
        working_condition: 'Brand new, unused.'
      },
      images: [
        { url: 'https://m.media-amazon.com/images/I/81HrZmVmmiL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/71IypdLRk+L._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/71VyyJRHSHL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/81RvqOwWodL._SX679_.jpg' }
      ]
    },
    // 2. Solar Charger
    {
      product: {
        title: 'Solar-Powered Charger',
        description: "A waterproof (IP65) and foldable solar panel charger designed for outdoor activities. It has a high conversion efficiency of up to 24% and features dual smart USB outputs to charge multiple devices like phones and tablets simultaneously. Its lightweight and portable design includes carabiners to easily attach to a backpack.\n\nWhat's in the box: 10W Solar Panel, USB A-to-C Cable, Two Carabiners, User Manual.\nSpecial Features: Waterproof (IP65), 24% Conversion Efficiency, Dual Smart USB Output, Foldable.",
        price: 0.00, // Price is unavailable
        seller_id: seller2.id,
        category_id: categoryMap['electronics'],
        quantity: 0,
        condition: 'New',
        brand: 'BLAVOR',
        material: 'Monocrystalline Silicon, ETFE Film, Oxford Cloth',
        color: 'Black',
        dimension_l: 19.5,
        dimension_w: 7.4,
        dimension_h: 1,
        is_original: true,
        has_manual: true,
        working_condition: 'Brand new, in original packaging.'
      },
      images: [
        { url: 'https://m.media-amazon.com/images/I/91wPad8FMIL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/71dJwtbVvtL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/81Z2kLGFE3L._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/81l4JruJOjL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/81ftchB3reL._SL1500_.jpg' }
      ]
    },
    // 3. Eco-Friendly Phone Case
    {
      product: {
        title: 'Eco-Friendly Phone Case',
        description: "An eco-friendly case made from new bio-based plant materials. It offers military-grade drop protection with a tough back panel and flexible TPU bumper. A key feature is the flip-top camera cover that doubles as a stand, protecting the lens from scratches while ensuring privacy. The case has a premium, non-slip feel and is resistant to smudges and fingerprints.\n\nCompatible Model: iPhone 16 Pro Max.\nWhat's in the box: Eco-Friendly Case, Camera Cover/Stand, Packaging Box.\nSpecial Features: Camera Protection & Stand, Military-Grade Drop Protection, Non-Slip Design, UV resistant.",
        price: 3799.00,
        seller_id: seller1.id,
        category_id: categoryMap['electronics'],
        quantity: 15,
        condition: 'New',
        brand: 'Nillkin',
        model: 'iPhone 16 Pro Max',
        material: 'Bio-based plant materials, TPU Bumper',
        color: 'Green Forest',
        is_original: true,
        has_manual: false,
        working_condition: 'Brand new, in original packaging.'
      },
      images: [
        { url: 'https://m.media-amazon.com/images/I/71dLd0JxU7L._SX522_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/61CMfLYEeaL._SX522_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/71EL-xNevmL._SX522_.jpg' }
      ]
    },
    // 4. Reusable Beeswax Food Wraps
    {
      product: {
        title: 'Reusable Beeswax Food Wraps',
        description: "A sustainable, plastic-free alternative to cling film for food storage. Made from 100% natural beeswax and cotton, these wraps are biodegradable, non-toxic, and washable. The set includes three different sizes perfect for wrapping cheese, fruits, vegetables, and snacks.\n\nWhat's in the box: Set of 3 beeswax wraps (Small, Medium, and Large).\nSpecial Features: Reusable, Washable, Biodegradable, Plastic-Free, Non-toxic.",
        price: 418.00,
        seller_id: seller1.id,
        category_id: categoryMap['kitchen'],
        quantity: 112,
        condition: 'New',
        brand: 'UNDER THE MANGO TREE',
        material: 'Beeswax, Organic Cotton, Coconut Oil, Natural Tree Resin',
        color: 'Assorted Patterns',
        is_original: true,
        has_manual: true,
        working_condition: 'Brand new, unused.'
      },
      images: [
        { url: 'https://m.media-amazon.com/images/I/81p8rofQbBL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/713E8wL6GaL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/81IIYwbskjL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/71Sd93wpQtL._SX679_.jpg' }
      ]
    },
    // 5. Organic Cotton Tote Bag
    {
      product: {
        title: 'Organic Cotton Tote Bag',
        description: "A stylish and spacious tote bag crafted from 100% organic cotton. It features sturdy shoulder handles, a zip closure, and can hold up to 10kg. The bag is machine washable, foldable, and ethically made in a certified facility, making it perfect for college, work, or casual daily use.\n\nWhat's in the box: 1 x Tote bag.\nSpecial Features: Machine Washable, Zip Closure, Embroidered Design, Holds up to 10kg.",
        price: 329.00,
        seller_id: seller2.id,
        category_id: categoryMap['accessories'],
        quantity: 250,
        condition: 'New',
        brand: 'MASQ',
        material: '100% Organic Cotton Canvas',
        color: 'Poppy Flower',
        dimension_l: 36,
        dimension_w: 36,
        dimension_h: 10,
        is_original: true,
        has_manual: false,
        working_condition: 'Brand new, unused.'
      },
      images: [
        { url: 'https://m.media-amazon.com/images/I/814GaqOUXVL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/715D-c7f1FL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/81cEhQVqJjL._SX679_.jpg' }
      ]
    },
    // 6. Upcycled Denim Jacket
    {
      product: {
        title: 'Upcycled Denim Jacket',
        description: "A unique, one-of-a-kind upcycled denim jacket featuring exquisite materials from vintage Japanese kimonos. This men's size small jacket is made from a blend of cotton and silk.\n\nSize: Men's S.\nSpecial Features: One-of-a-kind, Upcycled from authentic vintage materials.",
        price: 9500.00, // Approx NZ $190 converted to INR
        seller_id: seller1.id,
        category_id: categoryMap['clothing'],
        quantity: 1,
        condition: 'Upcycled; vintage fabric is in \'Good\' condition with some discoloration.',
        brand: 'Hena Hena',
        material: 'Cotton (Denim), Silk (from vintage Kimono)',
        color: 'Various Blue Tones',
        is_original: false, // It's upcycled
        has_manual: false,
        working_condition: 'Jacket is upcycled; vintage fabric is in \'Good\' condition with some discoloration.'
      },
      images: [
        { url: 'https://felt.co.nz/user-images/itemuploads/u90632/i1074171/l.jpg' }
      ]
    },
    // 7. Sustainable Bamboo Toothbrush Set
    {
      product: {
        title: 'Sustainable Bamboo Toothbrush Set',
        description: "A pack of 10 eco-friendly and biodegradable bamboo toothbrushes. The brushes feature soft, charcoal-infused bristles for effective cleaning and are treated with neem oil for natural antibacterial protection. The handles are home-compostable, making it a zero-waste option for oral care.\n\nWhat's in the box: 10 Bamboo Toothbrushes (5 Black Bristles, 5 Yellow Bristles), 1 Cotton bag.\nSpecial Features: Biodegradable Handle, Charcoal Infused Bristles, Neem Oil-Treated.",
        price: 297.00,
        seller_id: seller2.id,
        category_id: categoryMap['personal care'],
        quantity: 180,
        condition: 'New',
        brand: 'Generic',
        material: 'Bamboo Handle, BPA-free bristles',
        color: 'Natural Bamboo',
        is_original: true,
        has_manual: false,
        working_condition: 'Brand new, in original packaging.'
      },
      images: [
        { url: 'https://m.media-amazon.com/images/I/71woZDuHuuL._SX679_PIbundle-10,TopRight,0,0_AA679SH20_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/71z1moSmSNL._SX679_.jpg' },
        { url: 'https://m.media-amazon.com/images/I/91y1ocoIskL._SX679_.jpg' }
      ]
    }
  ];

  for (const { product, images } of productsToCreate) {
    await prisma.product.create({
      data: {
        ...product,
        images: {
          create: images,
        },
      },
    });
  }

  console.log('✅ Sample products and images created.');
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
