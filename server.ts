import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Automated check and sync of Stockfish engines on server boot
function verifyStockfishEngines() {
  const srcDir = path.join(process.cwd(), 'node_modules/stockfish/bin');
  const destDir = path.join(process.cwd(), 'public/engines');

  if (fs.existsSync(srcDir)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    try {
      const files = fs.readdirSync(srcDir);
      let copiedCount = 0;
      files.forEach(file => {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        if (fs.statSync(srcFile).isFile()) {
          let shouldCopy = true;
          if (fs.existsSync(destFile)) {
            if (fs.statSync(srcFile).size === fs.statSync(destFile).size) {
              shouldCopy = false;
            }
          }
          if (shouldCopy) {
            fs.copyFileSync(srcFile, destFile);
            copiedCount++;
          }
        }
      });
      console.log(`[Stockfish Verification] Verification complete. Auto-restored ${copiedCount} files.`);
    } catch (err: any) {
      console.warn("[Stockfish Verification] Error during auto-restoration:", err.message);
    }
  } else {
    console.warn("[Stockfish Verification] node_modules/stockfish/bin directory not found. Skipping auto-restore.");
  }
}

async function startServer() {
  verifyStockfishEngines();
  const app = express();
  const PORT = 3000;

  // Inject Cross-Origin Opener/Embedder Policy headers for multi-threaded Stockfish
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
  });

  // Serve static assets from public directory directly if needed
  app.use('/engines', express.static(path.join(process.cwd(), 'public/engines'), {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    }
  }));

  // Serve SPA or Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
