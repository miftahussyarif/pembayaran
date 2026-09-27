import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';

/**
 * Temporary test endpoint to create a pembayaran without auth.
 * Enabled when ALLOW_TEST_PAYMENTS=true in environment.
 */
export async function POST({ request }) {
  if (String(process.env.ALLOW_TEST_PAYMENTS) !== 'true') {
    return json({ error: 'disabled' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  // pick a santri, jenis_pembayaran, tahun_ajaran and admin user
  const [{ id: santriId } = {}] = await db.select({ id: schema.santri.id }).from(schema.santri).limit(1);
  const [{ id: jenisId, nominalDefault } = {}] = await db.select({ id: schema.jenisPembayaran.id, nominalDefault: schema.jenisPembayaran.nominalDefault }).from(schema.jenisPembayaran).limit(1);
  const [{ id: tahunId } = {}] = await db.select({ id: schema.tahunAjaran.id }).from(schema.tahunAjaran).limit(1);
  const [{ id: adminId } = {}] = await db.select({ id: schema.users.id }).from(schema.users).where(schema.users.role.eq('admin')).limit(1);

  if (!jenisId || !tahunId) {
    return json({ error: 'missing-schema-data' }, { status: 500 });
  }

  const nominal = Number(body.nominal ?? nominalDefault ?? 0) || 0;
  const now = new Date().toISOString();
  const nomorKwitansi = `TEST-${Date.now()}-${Math.floor(Math.random()*10000)}`;

  const insert = await db.insert(schema.pembayaran).values({
    santriId: body.santriId ? Number(body.santriId) : santriId || null,
    jenisPembayaranId: body.jenisPembayaranId ? Number(body.jenisPembayaranId) : jenisId,
    tahunAjaranId: body.tahunAjaranId ? Number(body.tahunAjaranId) : tahunId,
    bulan: body.bulan || null,
    tahunTagihan: body.tahunTagihan ? Number(body.tahunTagihan) : null,
    tanggalBayar: now,
    nominalDibayar: nominal,
    nomorKwitansi,
    inputById: adminId || null,
    keteranganKhusus: body.keteranganKhusus || null
  }).returning({ id: schema.pembayaran.id });

  const inserted = Array.isArray(insert) ? insert[0] : insert;

  return json({ ok: true, inserted }, { status: 201 });
}
