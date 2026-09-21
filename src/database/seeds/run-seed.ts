import { Logger } from '@nestjs/common';
import * as argon2 from 'argon2';

import dataSource from '../data-source';
import { User } from '@/modules/users/users.entity';

const logger = new Logger('Seed');

async function run(): Promise<void> {
  await dataSource.initialize();
  const userRepository = dataSource.getRepository(User);

  const adminEmail = 'admin@example.com';
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
    withDeleted: true,
  });

  if (existingAdmin && !existingAdmin.deletedAt) {
    logger.log(`Admin user already exists: ${adminEmail}`);
  } else {
    if (existingAdmin) {
      await userRepository.delete({ id: existingAdmin.id });
    }
    const passwordHash = await argon2.hash('Admin@123', { type: argon2.argon2id });
    const admin = userRepository.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isActive: true,
    });
    await userRepository.save(admin);
    logger.log(`Created admin user: ${adminEmail} / Admin@123`);
  }

  const userEmail = 'user@example.com';
  const existingUser = await userRepository.findOne({
    where: { email: userEmail },
    withDeleted: true,
  });

  if (existingUser && !existingUser.deletedAt) {
    logger.log(`Test user already exists: ${userEmail}`);
  } else {
    if (existingUser) {
      await userRepository.delete({ id: existingUser.id });
    }
    const passwordHash = await argon2.hash('User@123', { type: argon2.argon2id });
    const user = userRepository.create({
      name: 'Test User',
      email: userEmail,
      passwordHash,
      role: 'user',
      isActive: true,
    });
    await userRepository.save(user);
    logger.log(`Created test user: ${userEmail} / User@123`);
  }

  await dataSource.destroy();
}

run()
  .then(() => {
    logger.log('Seeding completed.');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seeding failed', error);
    process.exit(1);
  });
