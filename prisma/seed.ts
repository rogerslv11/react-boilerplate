import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  const adminEmail = 'admin@boilerplate.local';
  const userEmail = 'user@boilerplate.local';

  const adminPassword = await argon2.hash('Admin@123456');
  const userPassword = await argon2.hash('User@123456');

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrator',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      name: 'Regular User',
      password: userPassword,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  console.log('Seed completed:');
  console.log(`  admin: ${adminEmail} / Admin@123456`);
  console.log(`  user : ${userEmail} / User@123456`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
