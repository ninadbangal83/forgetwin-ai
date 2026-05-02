const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('--- ALL CAD MODELS ---');
  const models = await prisma.cadModel.findMany({ orderBy: { createdAt: 'desc' } });
  for (const m of models) {
    console.log(`ID: ${m.id} | Name: ${m.name} | Status: ${m.status}`);
  }

  console.log('\n--- ALL USERS ---');
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    for (const u of users) {
      console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role}`);
    }
  } catch (err) {
    console.error('Failed to query users', err);
  }

  await prisma.$disconnect();
}

check();

