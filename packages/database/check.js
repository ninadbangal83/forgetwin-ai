const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const models = await prisma.cadModel.findMany({ orderBy: { createdAt: 'desc' } });
  for (const m of models) {
    console.log(`ID: ${m.id} | Name: ${m.name} | Status: ${m.status}`);
  }
  await prisma.$disconnect();
}

check();
