import Database from 'better-sqlite3';
const db = new Database('./sqlite.db');

try {
	const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
	console.log('Tables:', tables);

	const stmt = db.prepare("SELECT * FROM pengaturan_pesantren");
	console.log('Result:', stmt.all());
} catch(e) {
	console.error('ERROR DB:', e.message);
}
db.close();
