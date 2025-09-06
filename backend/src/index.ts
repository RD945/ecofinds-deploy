import 'dotenv/config';
import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    const server = app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
      });
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
      });
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Could not start server');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error('❌ Unhandled error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
