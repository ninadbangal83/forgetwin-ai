const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clear() {
  await prisma.cadModel.deleteMany({});
  console.log('Database cleared completely.');
  await prisma.$disconnect();
}

clear();
