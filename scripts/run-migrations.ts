import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const migrations = [
  '2026050301_loyalty_tables',
  '2026050302_adsqr_tables',
];

async function runMigrations() {
  for (const migration of migrations) {
    console.log(`Running migration: ${migration}`);
    try {
      execSync(`npx prisma migrate deploy --name ${migration}`, { stdio: 'inherit' });
      console.log(`✓ ${migration} completed`);
    } catch (error) {
      console.error(`✗ ${migration} failed:`, error);
    }
  }
}

runMigrations();
