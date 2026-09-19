// Script to copy .htaccess file after build
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const source = join(__dirname, '../public/.htaccess');
const dest = join(__dirname, '../dist/.htaccess');

try {
  if (existsSync(source)) {
    copyFileSync(source, dest);
    console.log('✓ .htaccess file copied to dist/');
  } else {
    console.log('⚠ .htaccess file not found in public/, skipping...');
  }
} catch (error) {
  console.error('Error copying .htaccess:', error.message);
  process.exit(1);
}

