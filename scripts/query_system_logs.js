import pg from 'pg';
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://devuser:devpass@localhost:5432/pembayaran_dev' });
  await client.connect();
  try {
    const res = await client.query(`SELECT id, created_at, aksi, modul, keterangan, stack_trace FROM system_logs WHERE modul='transaksi' OR aksi='input' ORDER BY id DESC LIMIT 30;`);
    for (const row of res.rows) {
      console.log('--- LOG ---');
      console.log('id:', row.id);
      console.log('created_at:', row.created_at);
      console.log('aksi:', row.aksi);
      console.log('modul:', row.modul);
      console.log('keterangan:', row.keterangan);
      console.log('stack_trace:');
      console.log(row.stack_trace || '<no stack>');
      console.log('\n');
    }
  } catch (e) {
    console.error('Query error', e);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

main();
