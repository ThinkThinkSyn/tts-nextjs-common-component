const { existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Only build if dist folder doesn't exist (git install scenario)
const distPath = path.join(__dirname, 'dist');
if (!existsSync(distPath)) {
  console.log('Building package from source...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}
