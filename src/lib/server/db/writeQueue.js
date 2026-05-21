/**
 * writeQueue.js — Serialized Write Queue untuk SQLite
 *
 * SQLite file-based database hanya mendukung satu penulis pada satu waktu.
 * Modul ini memastikan semua operasi tulis dieksekusi secara serial (satu per satu),
 * sehingga tidak terjadi "database is locked" ketika banyak user menyimpan bersamaan.
 *
 * Cara kerja:
 * - Semua panggilan `dbWrite(fn)` dimasukkan ke dalam antrian (queue).
 * - Setiap operasi dieksekusi secara berurutan dan menunggu selesai sebelum eksekusi berikutnya.
 * - Jika operasi gagal, error dilempar ke pemanggil, tapi antrian tetap jalan.
 * - Timeout 10 detik per operasi untuk mencegah antrian macet selamanya.
 */

let queue = Promise.resolve();

const WRITE_TIMEOUT_MS = 10_000; // 10 detik

/**
 * Bungkus operasi database write ke dalam antrian serial.
 * @param {() => Promise<T> | T} fn - Fungsi yang melakukan operasi DB write
 * @returns {Promise<T>}
 */
export function dbWrite(fn) {
	const result = queue.then(() => {
		return Promise.race([
			Promise.resolve().then(fn),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('DB write timeout (>10s)')), WRITE_TIMEOUT_MS)
			)
		]);
	});

	// Lanjutkan antrian meski ada error (jangan sampai antrian macet)
	queue = result.catch(() => {});

	return result;
}
