const { db } = require('./src/lib/server/db/index.js');
const schema = require('./src/lib/server/db/schema.js');

try {
  db.transaction((tx) => {
    const res = tx.insert(schema.santri).values({ nomorInduk: '99999', namaLengkap: 'Test Tx', tanggalMasuk: null, tanggalKeluar: null, kategoriId: null, isActive: true }).returning();
    console.log("res is array?", Array.isArray(res));
    throw new Error('rollback');
  });
} catch(e) {
  console.log(e.message);
}
