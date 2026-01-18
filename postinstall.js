import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[@thinkthinksyn/nextjs-component] Running postinstall...');
console.log('[@thinkthinksyn/nextjs-component] Package directory:', __dirname);
console.log('[@thinkthinksyn/nextjs-component] Init CWD:', process.env.INIT_CWD);

// Only build if dist folder doesn't exist (git install scenario)
const distPath = join(__dirname, 'dist');

if (existsSync(distPath)) {
  console.log('[@thinkthinksyn/nextjs-component] ✓ Dist folder exists, skipping build');
  process.exit(0);
}

console.log('[@thinkthinksyn/nextjs-component] Dist folder not found, building from source...');

// Check if devDependencies are installed (required for build)
const nodeModulesPath = join(__dirname, 'node_modules');
if (!existsSync(nodeModulesPath)) {
  console.log('[@thinkthinksyn/nextjs-component] Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  } catch (error) {
    console.error('[@thinkthinksyn/nextjs-component] ✗ Dependency installation failed:', error.message);
    process.exit(1);
  }
}

console.log('[@thinkthinksyn/nextjs-component] Running build...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('[@thinkthinksyn/nextjs-component] ✓ Build completed successfully');
} catch (error) {
  console.error('[@thinkthinksyn/nextjs-component] ✗ Build failed:', error.message);
  process.exit(1);
}
