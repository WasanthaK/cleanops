/**
 * Seed script for local development database.
 */
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const worker = await prisma.worker.upsert({
    where: { email: 'worker@example.com' },
    update: {},
    create: {
      id: 'worker-demo-1',
      email: 'worker@example.com',
      passwordHash,
      name: 'Demo Worker',
      role: 'cleaner'
    }
  });

  const site = await prisma.site.upsert({
    where: { id: 'site-demo-1' },
    update: {},
    create: {
      id: 'site-demo-1',
      name: 'Sydney CBD Office',
      address: '123 Pitt Street, Sydney NSW',
      timezone: 'Australia/Sydney'
    }
  });

  await prisma.job.upsert({
    where: { id: 'job-demo-1' },
    update: {},
    create: {
      id: 'job-demo-1',
      siteId: site.id,
      title: 'Weekly Office Clean',
      scheduledDate: new Date().toISOString(),
      assignments: {
        create: {
          workerId: worker.id
        }
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
