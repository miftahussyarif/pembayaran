import fs from 'fs/promises';
import path from 'path';

const BLOB_URL = process.env.BLOB_URL || process.env.VERCEL_BLOB_URL || null;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_TOKEN || null;

function getBlobConfig() {
  return {
    url: BLOB_URL,
    token: BLOB_READ_WRITE_TOKEN
  };
}

async function uploadToVercelBlob(buffer, filename, folder = '') {
  const { url, token } = getBlobConfig();
  if (!url || !token) {
    throw new Error('Vercel Blob config missing');
  }

  const uploadUrl = new URL(url);
  uploadUrl.pathname = path.posix.join(uploadUrl.pathname || '/', folder || '', filename);

  const res = await fetch(uploadUrl.toString(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream'
    },
    body: buffer
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Vercel Blob upload failed: ${res.status} ${res.statusText} ${body}`);
  }

  return uploadUrl.toString();
}

async function upload(buffer, filename, folder = '') {
  const { url, token } = getBlobConfig();
  if (url && token) {
    return uploadToVercelBlob(buffer, filename, folder);
  }

  const uploadsDir = path.join(process.cwd(), 'static', 'uploads', 'blob');
  await fs.mkdir(uploadsDir, { recursive: true });
  const dest = path.join(uploadsDir, filename);
  await fs.writeFile(dest, buffer);
  return `/uploads/blob/${encodeURIComponent(filename)}`;
}

function getUrl(filename, folder = '') {
  const { url, token } = getBlobConfig();
  if (url && token) {
    const uploadUrl = new URL(url);
    uploadUrl.pathname = path.posix.join(uploadUrl.pathname || '/', folder || '', filename);
    return uploadUrl.toString();
  }
  return `/uploads/blob/${encodeURIComponent(filename)}`;
}

export { upload, getUrl };
