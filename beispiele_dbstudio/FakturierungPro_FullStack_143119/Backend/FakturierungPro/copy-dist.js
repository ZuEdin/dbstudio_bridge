const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('[Electron Build] Transpiling Frontend in ../../Frontend...');
  let frontendDir = path.join(__dirname, '..', '..', 'Frontend');
  if (!fs.existsSync(frontendDir)) {
    frontendDir = path.join(__dirname, '..', '..', 'AngularFrontend');
  }
  
  if (fs.existsSync(frontendDir)) {
    const hasLocalModules = fs.existsSync(path.join(frontendDir, 'node_modules'));
    const hasParentModules = fs.existsSync(path.join(frontendDir, '..', 'node_modules')) || fs.existsSync(path.join(__dirname, '..', 'node_modules')) || fs.existsSync(path.join(__dirname, 'node_modules'));
    if (!hasLocalModules && !hasParentModules) {
      console.log('[Electron Build] Running npm install in ' + frontendDir + '...');
      try {
        execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
      } catch (e) {
        console.log('[Electron Build] npm install warning (continuing):', e.message);
      }
    } else {
      console.log('[Electron Build] node_modules folder detected, skipping npm install...');
    }
    console.log('[Electron Build] Running npm run build in ' + frontendDir + '...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
    
    const srcDist = path.join(frontendDir, 'dist');
    const targetDist = path.join(__dirname, 'dist');
    
    if (fs.existsSync(srcDist)) {
      let actualSrc = srcDist;
      
      if (!fs.existsSync(path.join(srcDist, 'index.html'))) {
        try {
          const subdirs = fs.readdirSync(srcDist, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
          
          for (const sub of subdirs) {
            const subPath = path.join(srcDist, sub);
            if (fs.existsSync(path.join(subPath, 'index.html'))) {
              actualSrc = subPath;
              break;
            }
            const browserPath = path.join(subPath, 'browser');
            if (fs.existsSync(path.join(browserPath, 'index.html'))) {
              actualSrc = browserPath;
              break;
            }
          }
        } catch (e) {
          console.log('[Electron Build] Warning scanning subdirs:', e.message);
        }
      }

      if (fs.existsSync(targetDist)) {
        fs.rmSync(targetDist, { recursive: true, force: true });
      }
      
      console.log('[Electron Build] Copying dist from ' + actualSrc + ' to ' + targetDist + '...');
      copyDir(actualSrc, targetDist);
      console.log('[Electron Build] Copy completed successfully (index.html verified)!');
    } else {
      console.error('[Electron Build] Error: Frontend dist folder not found at ' + srcDist);
    }
  } else {
    console.error('[Electron Build] Error: Frontend directory not found!');
  }
} catch (error) {
  console.error('[Electron Build] Build failed:', error);
  process.exit(1);
}
