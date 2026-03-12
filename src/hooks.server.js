import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
	// 1. Ambil session cookie
	const sessionCookie = event.cookies.get('sessionid');
	let sessionUser = null;

	if (sessionCookie) {
		try {
			sessionUser = JSON.parse(sessionCookie);
		} catch (e) {
			// invalid cookie JSON
		}
	}

	// 2. Proteksi Halaman Internal
	// Jika user BUKAN di halaman /login, dan dia TIDAK PUNYA session -> Redirect ke /login
	if (event.url.pathname !== '/login' && !sessionUser) {
		throw redirect(303, '/login');
	}

	// Jika Punya session, dan malah mencoba buka halaman /login -> Redirect ke dashboard (/)
	if (event.url.pathname === '/login' && sessionUser) {
		throw redirect(303, '/');
	}

	// 2.5 Role-Based Page Access Protection
	if (sessionUser) {
		const path = event.url.pathname;
		
		if (sessionUser.role === 'bendahara') {
			// Bendahara is only allowed on /, /master/*, /transaksi/*, and /logout
			const isAllowedForBendahara = 
				path === '/' || 
				path.startsWith('/master/') || 
				path.startsWith('/transaksi/') ||
				path === '/pengaturan/saldo-keuangan' ||
				path === '/logout';
				
			if (!isAllowedForBendahara) {
				throw redirect(303, '/');
			}
		}
		
		if (sessionUser.role === 'petugas') {
			// Petugas hanya boleh akses dashboard dan menu transaksi tertentu
			const isAllowedForPetugas =
				path === '/' ||
				path === '/transaksi/input' ||
				path === '/transaksi/riwayat' ||
				path === '/transaksi/rekapitulasi' ||
				path === '/transaksi/rekap-individu' ||
				path.startsWith('/transaksi/cetak/') ||
				path === '/logout';
			
			if (!isAllowedForPetugas) {
				throw redirect(303, '/');
			}
		}
	}

	// 3. Melekatkan session info ke `event.locals` agar bisa diakses oleh Svelte di components / layout
	event.locals.user = sessionUser || undefined;

	return resolve(event);
};
