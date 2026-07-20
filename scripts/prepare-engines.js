import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'node_modules/stockfish/bin');
const destDir = path.join(process.cwd(), 'public/engines');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) {
    console.error(`[Prepare Engines] Source directory not found: ${from}`);
    return;
  }
  
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }

  const files = fs.readdirSync(from);
  let copiedCount = 0;
  let skippedCount = 0;

  files.forEach(file => {
    const srcFile = path.join(from, file);
    const destFile = path.join(to, file);
    
    const srcStat = fs.statSync(srcFile);
    if (srcStat.isFile()) {
      let shouldCopy = true;
      if (fs.existsSync(destFile)) {
        const destStat = fs.statSync(destFile);
        // If file sizes match exactly, we can skip copying to save time and disk I/O
        if (srcStat.size === destStat.size) {
          shouldCopy = false;
        }
      }
      
      if (shouldCopy) {
        fs.copyFileSync(srcFile, destFile);
        copiedCount++;
      } else {
        skippedCount++;
      }
    }
  });

  console.log(`[Prepare Engines] Automation finished. Copied: ${copiedCount}, Skipped (already correct): ${skippedCount} files.`);
}

try {
  copyFolderSync(srcDir, destDir);
} catch (error) {
  console.error('[Prepare Engines] Error during engine preparation:', error);
}
