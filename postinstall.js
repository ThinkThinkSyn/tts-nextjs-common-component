import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Skip postinstall if this is a sub-dependency install
if (process.env.INIT_CWD && process.env.INIT_CWD !== __dirname) {
  console.log('Skipping build (installed as dependency)');
  process.exit(0);
}

// Only build if dist folder doesn't exist (git install scenario)
const distPath = join(__dirname, 'dist');
if (!existsSync(distPath)) {
  console.log('Building package from source...');
  
  // Check if devDependencies are installed (required for build)
  const nodeModulesPath = join(__dirname, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    console.log('Installing dependencies first...');
    try {
      execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    } catch (error) {
      console.error('Dependency installation failed:', error.message);
      process.exit(1);
    }
  }
  
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}
