<script>
	import { goto } from '$app/navigation';
	let { data } = $props();

	let nomorInduk = $state('');
	let isSearching = $state(false);
	let errorMsg = $state('');

	// Cooldown mechanism
	let isCooldown = $state(false);
	let cooldownSeconds = $state(0);

	function handleInput(e) {
		// Hanya izinkan input angka (hapus semua karakter non-angka)
		nomorInduk = e.target.value.replace(/[^0-9]/g, '');
	}

	function startCooldown(seconds) {
		isCooldown = true;
		cooldownSeconds = seconds;
		
		const interval = setInterval(() => {
			cooldownSeconds--;
			if (cooldownSeconds <= 0) {
				clearInterval(interval);
				isCooldown = false;
			}
		}, 1000);
	}

	async function handleSearch(e) {
		e.preventDefault();
		if (isCooldown || isSearching) return;

		if (!nomorInduk.trim()) {
			errorMsg = 'Silakan masukkan Nomor Induk Santri';
			return;
		}

		isSearching = true;
		errorMsg = '';

		try {
			// Try to fetch from public tanggungan data
			const res = await fetch('/public/api/cek/' + encodeURIComponent(nomorInduk.trim()));
			
			if (res.status === 429) {
				errorMsg = 'Terlalu banyak permintaan. Silakan tunggu sebentar.';
				startCooldown(15);
				return;
			}
			
			const result = await res.json();
			
			if (result.found) {
				goto('/public/' + encodeURIComponent(nomorInduk.trim()));
			} else {
				errorMsg = 'Nomor Induk Santri tidak ditemukan. Pastikan nomor yang dimasukkan benar.';
				// Beri cooldown 5 detik jika salah, untuk mencegah bruteforce
				startCooldown(5);
			}
		} catch {
			errorMsg = 'Terjadi kesalahan jaringan. Coba lagi nanti.';
			startCooldown(5);
		} finally {
			isSearching = false;
		}
	}

	const namaPesantren = $derived(data.profilPesantren?.namaPesantren || 'Pesantren Al-Hikmah');
	const alamat = $derived(data.profilPesantren?.alamat || '');
	const logoUrl = $derived(data.profilPesantren?.logoUrl || '');
</script>

<svelte:head>
	<title>Informasi Pembayaran - {namaPesantren}</title>
	<meta name="description" content="Halaman informasi pembayaran {namaPesantren} - Peraturan dan cek tanggungan santri" />
</svelte:head>

<!-- Hero Section with gradient background -->
<div class="relative overflow-hidden">
	<!-- Animated Background -->
	<div class="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900"></div>
	<div class="absolute inset-0 opacity-20" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%224%22 height=%224%22 patternUnits=%22userSpaceOnUse%22><circle cx=%222%22 cy=%222%22 r=%220.5%22 fill=%22white%22 opacity=%220.3%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>');"></div>
	
	<!-- Floating orbs -->
	<div class="absolute top-20 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
	<div class="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
	<div class="absolute top-40 right-1/4 w-48 h-48 bg-teal-300/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 2s;"></div>

	<div class="relative z-10 px-4 py-16 md:py-24 text-center">
		<!-- Logo -->
		{#if logoUrl}
			<div class="flex justify-center mb-6">
				<div class="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 p-2 shadow-2xl hover:scale-110 transition-transform duration-500">
					<img src={logoUrl} alt="Logo {namaPesantren}" class="w-full h-full object-contain rounded-full" />
				</div>
			</div>
		{:else}
			<div class="flex justify-center mb-6">
				<div class="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center shadow-2xl">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
				</div>
			</div>
		{/if}

		<h1 class="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
			{namaPesantren}
		</h1>
		{#if alamat}
			<p class="text-white/60 text-sm md:text-base max-w-lg mx-auto mb-2">{alamat}</p>
		{/if}
		<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs mt-2">
			<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
			Informasi Pembayaran
		</div>
	</div>
</div>

<!-- Search Section - The centrepiece -->
<div class="relative -mt-12 z-20 px-4">
	<div class="max-w-2xl mx-auto">
		<div class="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 md:p-8">
			<div class="text-center mb-6">
				<div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
				<h2 class="text-xl md:text-2xl font-bold text-gray-800">Cek Tanggungan Santri</h2>
				<p class="text-gray-500 text-sm mt-1">Masukkan Nomor Induk Santri untuk melihat informasi tanggungan</p>
			</div>

			<form onsubmit={handleSearch} class="space-y-4">
				<div class="relative">
					<input
						type="text"
						inputmode="numeric"
						pattern="[0-9]*"
						bind:value={nomorInduk}
						oninput={handleInput}
						placeholder="Nomor Induk Santri..."
						id="search-nomor-induk"
						class="w-full px-5 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all duration-300 bg-gray-50 hover:bg-white placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
						disabled={isSearching || isCooldown}
						autocomplete="off"
					/>
					<div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
						</svg>
					</div>
				</div>
				
				{#if errorMsg}
					<div class="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-shake">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
						{errorMsg}
					</div>
				{/if}
				
				<button
					type="submit"
					disabled={isSearching || isCooldown}
					id="btn-search-santri"
					class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
				>
					{#if isSearching}
						<span class="inline-flex items-center justify-center gap-2">
							<span class="loading loading-spinner loading-sm"></span>
							Mencari...
						</span>
					{:else if isCooldown}
						<span class="inline-flex items-center justify-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Coba lagi dalam {cooldownSeconds}s
						</span>
					{:else}
						Cek Tanggungan
					{/if}
				</button>

			</form>
			
			{#if data.lastUpdated}
				<p class="text-center text-xs text-gray-400 mt-4">
					Data terakhir diperbarui: {new Date(data.lastUpdated).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
				</p>
			{:else if !data.dataExists}
				<div class="text-center mt-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
					<p class="text-amber-700 text-xs">⚠️ Data belum tersedia. Data akan tersedia setelah admin melakukan backup.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Peraturan & Tata Tertib Pesantren Section -->
<div class="max-w-4xl mx-auto px-4 py-16">
	<div class="text-center mb-10">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium mb-4 tracking-wide uppercase">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			Tata Tertib Resmi
		</div>
		<h2 class="text-2xl md:text-3xl font-bold text-gray-800">Tata Tertib & Peraturan Pesantren</h2>
		<p class="text-gray-500 text-sm mt-2 max-w-xl mx-auto">Berikut adalah tata tertib, kewajiban, serta larangan yang berlaku bagi seluruh santri di {namaPesantren}</p>
	</div>

	<!-- Bagian Kewajiban -->
	<div class="mb-12">
		<div class="flex items-center gap-3 mb-6">
			<div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">A</div>
			<h3 class="text-xl font-bold text-gray-800">Kewajiban Santri</h3>
		</div>
		<div class="space-y-4 pl-4 md:pl-11 border-l-2 border-emerald-100 ml-4 md:ml-4">
			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-white"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Ibadah dan Kegiatan Belajar</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Wajib melaksanakan sholat berjamaah 5 waktu, mengikuti seluruh pengajian, madrasah diniyah, dan kegiatan ekstrakurikuler yang telah ditetapkan oleh pesantren.</p>
			</div>
			
			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-white"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Akhlak dan Etika</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Menjaga akhlakul karimah, menghormati para kiai, asatidz, pengurus, serta saling menghargai sesama santri. Berpakaian sopan, rapi, dan menutup aurat sesuai syariat Islam.</p>
			</div>

			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-white"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Ketertiban dan Kebersihan</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Menjaga kebersihan asrama, masjid, kamar mandi, dan lingkungan pesantren. Mematuhi jam malam dan jam istirahat yang telah ditentukan.</p>
			</div>
			
			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-white"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Administrasi</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Melunasi biaya syahriyah (SPP) dan tanggungan administrasi lainnya tepat waktu sesuai dengan ketentuan pesantren.</p>
			</div>
		</div>
	</div>

	<!-- Bagian Larangan -->
	<div>
		<div class="flex items-center gap-3 mb-6">
			<div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 font-bold">B</div>
			<h3 class="text-xl font-bold text-gray-800">Larangan-larangan</h3>
		</div>
		<div class="space-y-4 pl-4 md:pl-11 border-l-2 border-rose-100 ml-4 md:ml-4">
			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-rose-400 ring-4 ring-white group-hover:bg-rose-500 transition-colors"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Pelanggaran Berat (Tindak Pidana & Susila)</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Dilarang keras melakukan tindak kriminal (mencuri, berkelahi), mengkonsumsi miras/narkoba, berbuat asusila, atau membawa senjata tajam. Sanksi: Dikeluarkan dari pesantren.</p>
			</div>

			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-rose-400 ring-4 ring-white group-hover:bg-rose-500 transition-colors"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Alat Elektronik & Komunikasi</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Dilarang membawa, menyimpan, atau menggunakan handphone (HP), laptop, radio, atau barang elektronik lainnya tanpa izin resmi dari pengurus.</p>
			</div>

			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-rose-400 ring-4 ring-white group-hover:bg-rose-500 transition-colors"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Keluar Komplek Pesantren</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Dilarang keluar dari area komplek pesantren tanpa membawa surat izin dari pengurus keamanan atau pengasuh.</p>
			</div>

			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-rose-400 ring-4 ring-white group-hover:bg-rose-500 transition-colors"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Penampilan</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Dilarang berambut gondrong, memakai perhiasan berlebihan (bagi putra), serta berpenampilan menyerupai lawan jenis atau tidak sesuai syariat.</p>
			</div>
			
			<div class="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
				<div class="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-rose-400 ring-4 ring-white group-hover:bg-rose-500 transition-colors"></div>
				<h4 class="font-semibold text-gray-800 mb-1">Hubungan Santri Putra & Putri</h4>
				<p class="text-gray-500 text-sm leading-relaxed">Dilarang saling berkomunikasi secara langsung, berkirim surat, atau bertemu antara santri putra dan santri putri (berkhalwat) tanpa ada kepentingan syar'i dan didampingi pengurus.</p>
			</div>
		</div>
	</div>
</div>

<!-- Footer -->
<footer class="bg-gray-900 text-white/60 py-8 px-4">
	<div class="max-w-4xl mx-auto text-center">
		<p class="text-sm">&copy; {new Date().getFullYear()} {namaPesantren}. Seluruh hak dilindungi.</p>
		<p class="text-xs mt-1 text-white/30">Sistem Informasi Pembayaran Pesantren</p>
	</div>
</footer>

<style>
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
		20%, 40%, 60%, 80% { transform: translateX(4px); }
	}
	
	.animate-shake {
		animation: shake 0.5s ease-in-out;
	}
</style>
