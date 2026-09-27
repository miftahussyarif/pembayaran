Vercel Blob placeholder directory

This directory is a placeholder for artifacts and migration helpers related to Phase 4 (storage migration to Vercel Blob).

Workflow:

1. Add migration script to copy files from `static/uploads` into Vercel Blob.
2. Add `src/lib/server/storage.js` helper that exposes `upload(file)` and `getUrl(path)`.
3. Update backup/restore to read/write from blob storage.

Important: Do not commit production secrets to the repo. Use Vercel environment variables for API keys.
