import { readFileSync, writeFileSync } from 'fs';
import { existsSync } from 'fs';

function updateEnv(envFile: string, updates: Record<string, string>) {
  if (!existsSync(envFile)) {
    console.log(`✗ ${envFile} not found`);
    return;
  }

  let content = readFileSync(envFile, 'utf-8');

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;

    if (content.match(regex)) {
      content = content.replace(regex, newLine);
    } else {
      content += `\n${newLine}`;
    }
  }

  writeFileSync(envFile, content);
  console.log(`✓ Updated ${envFile}`);
}

// Example usage
// updateEnv('.env', {
//   DATABASE_URL: process.env.DATABASE_URL || '',
//   API_KEY: process.env.API_KEY || '',
// });
