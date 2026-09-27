#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { upload, getUrl } from '../src/lib/server/storage.js';

async function migrate() {
  const uploadsDir = path.join(process.cwd(), 'static', 'uploads');
  try {
    const files = await fs.readdir(uploadsDir);
    for (const f of files) {
      const srcPath = path.join(uploadsDir, f);
      const stat = await fs.stat(srcPath);
      if (!stat.isFile()) continue;
      const buf = await fs.readFile(srcPath);
      try {
        const remote = await upload(buf, f);
        console.log(`Migrated ${f} -> ${remote}`);
      } catch (e) {
        console.error(`Failed to migrate ${f}:`, e.message);
      }
    }
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  }
}

migrate();
