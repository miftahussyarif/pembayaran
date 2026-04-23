<script>
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';

	let { data, form } = $props();
	
	let selectedJenisId = $state('');
	let selectedSantriId = $state('');
	let selectedTahunAjaranId = $state('');
	let selectedBulan = $state('');
	let selectedTahunTagihan = $state('');
	let isSubmitting = $state(false);
	let santriSearch = $state('');
	let isKhusus = $state(false);
	let keteranganKhusus = $state('');
	let namaPembayarManual = $state('');
	let paymentItems = $state([]);
	let batchError = $state('');

	const formatRupiah = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');

	const BULAN_NAMES = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];
	
	let selectedJenis = $derived(data.jenisPembayarans.find(j => j.id == selectedJenisId) || null);
	let selectedSantri = $derived(data.santris.find(s => s.id == selectedSantriId) || null);
	let selectedTahunAjaran = $derived(data.tahunAjarans.find((ta) => ta.id == selectedTahunAjaranId) || null);
	let regularPayments = $derived((data.pembayaranReguler || []).filter((p) => !p.keteranganKhusus));
	let importedTunggakan = $derived(data.tunggakanImport || []);
	let filteredSantris = $derived.by(() => {
		const query = santriSearch.trim().toLowerCase();
		let list = data.santris;
		if (query) {
			list = data.santris.filter((s) => {
				const nomor = String(s.nomorInduk || '').toLowerCase();
				const nama = String(s.namaLengkap || '').toLowerCase();
				return nomor.includes(query) || nama.includes(query);
			});
		}
		if (selectedSantriId && !list.some((s) => s.id == selectedSantriId)) {
			const selected = data.santris.find((s) => s.id == selectedSantriId);
			if (selected) list = [selected, ...list];
		}
		return list;
	});
	
	let nominal = $state(0);
	let isBulanan = $derived(
		!isKhusus && (
			selectedJenis?.tipe === 'bulanan' ||
			selectedJenis?.tipe === 'smk_bulanan' ||
			selectedJenis?.tipe === 'smp_bulanan'
		)
	);
	let isTahunan = $derived(
		!isKhusus && (
			selectedJenis?.tipe === 'tahunan' ||
			selectedJenis?.tipe === 'smk_tahunan' ||
			selectedJenis?.tipe === 'smp_tahunan'
		)
	);
	let isSekali = $derived(
		!isKhusus && (
			selectedJenis?.tipe === 'sekali' ||
			selectedJenis?.tipe === 'smk_sekali' ||
			selectedJenis?.tipe === 'smp_sekali'
		)
	);

	let isGratis = $derived.by(() => {
		if (isKhusus) return false;
		if (!selectedSantriId || !selectedJenisId) return false;
		// Cari mapping kategoriGratis yang cocok
		const mapping = data.kategoriGratis.find(g =>
			g.kategoriId == selectedSantri?.kategoriId &&
			g.jenisPembayaranId == selectedJenisId
		);
		// Hanya gratis jika mapping ada dan nominal === 0
		if (mapping && Number(mapping.nominal) === 0) return true;
		// Jika tidak ada mapping, cek default nominal jenis pembayaran
		const jenis = data.jenisPembayarans.find(j => j.id == selectedJenisId);
		if (jenis && Number(jenis.nominalDefault) === 0) return true;
		return false;
	});

	let nominalEfektif = $derived.by(() => {
		if (isKhusus || !selectedJenis) return 0;
		if (isGratis) return 0;

		if (selectedSantri && selectedJenisId) {
			const customMapping = data.kategoriGratis.find(g =>
				g.kategoriId == selectedSantri.kategoriId &&
				g.jenisPembayaranId == selectedJenisId &&
				g.nominal !== null
			);
			if (customMapping) return Number(customMapping.nominal || 0);
		}

		if (/konsumsi/i.test(selectedJenis.namaPembayaran) && selectedSantri?.nominalKonsumsi !== undefined) {
			return Number(selectedSantri.nominalKonsumsi || 0);
		}

		return Number(selectedJenis?.nominalDefault || 0);
	});

	let selectedPaymentStatus = $derived.by(() => {
		if (isKhusus || !selectedSantriId || !selectedJenisId || !selectedJenis) return null;

		const relevantPayments = regularPayments.filter((p) =>
			p.santriId == selectedSantriId &&
			p.jenisPembayaranId == selectedJenisId
		);

		const importedTotal = importedTunggakan
			.filter((item) =>
				item.santriId == selectedSantriId &&
				item.tahunAjaranId == selectedTahunAjaranId &&
				item.jenisPembayaranId == selectedJenisId &&
				String(item.bulan || '') === String(isBulanan ? selectedBulan : '') &&
				String(item.tahunTagihan || '') === String(isBulanan ? selectedTahunTagihan : '')
			)
			.reduce((sum, item) => sum + Number(item.nominalTagihan || 0), 0);
		const totalTagihan = importedTotal > 0 ? importedTotal : nominalEfektif;

		if (isBulanan) {
			if (!selectedBulan || !selectedTahunTagihan || !selectedTahunAjaranId) return null;
			const periodPayments = relevantPayments.filter((p) =>
				p.tahunAjaranId == selectedTahunAjaranId &&
				p.bulan === selectedBulan &&
				String(p.tahunTagihan || '') === String(selectedTahunTagihan || '')
			);
			const totalDibayar = periodPayments.reduce((sum, p) => sum + Number(p.nominalDibayar || 0), 0);
			return {
				totalTagihan,
				totalDibayar,
				sisa: Math.max(0, totalTagihan - totalDibayar),
				isLunas: totalDibayar >= totalTagihan && totalTagihan >= 0
			};
		}

		if (isTahunan) {
			if (!selectedTahunAjaranId) return null;
			const yearPayments = relevantPayments.filter((p) => p.tahunAjaranId == selectedTahunAjaranId);
			const totalDibayar = yearPayments.reduce((sum, p) => sum + Number(p.nominalDibayar || 0), 0);
			return {
				totalTagihan,
				totalDibayar,
				sisa: Math.max(0, totalTagihan - totalDibayar),
				isLunas: totalDibayar >= totalTagihan && totalTagihan >= 0
			};
		}

		if (isSekali) {
			const totalDibayar = relevantPayments.reduce((sum, p) => sum + Number(p.nominalDibayar || 0), 0);
			return {
				totalTagihan,
				totalDibayar,
				sisa: Math.max(0, totalTagihan - totalDibayar),
				isLunas: totalDibayar >= totalTagihan && totalTagihan >= 0
			};
		}

		return null;
	});

	let paymentItemsJson = $derived(JSON.stringify(paymentItems));
	let totalPaymentItems = $derived(paymentItems.reduce((sum, item) => sum + Number(item.nominalDibayar || 0), 0));

	let isFormValid = $derived.by(() => {
		// Jika sudah ada items, tetap perlu validasi tahun ajaran
		if (paymentItems.length > 0) return selectedTahunAjaranId !== '';
		if (!selectedTahunAjaranId) return false;
		if (isKhusus) {
			return (selectedSantriId || namaPembayarManual.trim().length > 0) &&
				keteranganKhusus.trim().length > 0 &&
				nominal > 0;
		}
		if (!selectedSantriId) return false;
		return selectedJenisId &&
			(isGratis ? nominal >= 0 : nominal > 0) &&
			(!isBulanan || (selectedBulan && selectedTahunTagihan)) &&
			!(selectedPaymentStatus?.isLunas);
	});

	// Cek apakah bulan sudah lunas
	let isBulanLunas = $derived.by(() => {
		return !!selectedPaymentStatus?.isLunas && isBulanan;
	});

	function getTahunTagihanOptions(tahunAjaranNama) {
		const normalized = String(tahunAjaranNama || '').trim();
		const slashMatch = normalized.match(/^(\d{4})\s*\/\s*(\d{4})$/);
		if (slashMatch) {
			return [Number(slashMatch[1]), Number(slashMatch[2])];
		}

		const directYearMatch = normalized.match(/(\d{4})/);
		if (directYearMatch) {
			return [Number(directYearMatch[1])];
		}

		return [new Date().getFullYear()];
	}

	function inferDefaultTahunTagihan(tahunAjaranNama, bulan) {
		const options = getTahunTagihanOptions(tahunAjaranNama);
		if (options.length === 1) return String(options[0]);

		const monthIndex = BULAN_NAMES.indexOf(bulan);
		if (monthIndex >= 0 && monthIndex <= 5) return String(options[1]);
		if (monthIndex >= 6) return String(options[0]);
		return String(options[0]);
	}

	let tahunTagihanOptions = $derived.by(() => getTahunTagihanOptions(selectedTahunAjaran?.nama));
	let importedCustomOptions = $derived.by(() => {
		if (!selectedSantriId || !selectedTahunAjaranId || !data.khususJenisId) return [];

		const grouped = new Map();
		for (const item of importedTunggakan) {
			if (
				item.santriId != selectedSantriId ||
				item.tahunAjaranId != selectedTahunAjaranId ||
				item.jenisPembayaranId != data.khususJenisId ||
				!item.keteranganKhusus
			) {
				continue;
			}

			const key = item.keteranganKhusus.trim().toLowerCase();
			if (!grouped.has(key)) {
				grouped.set(key, { label: item.keteranganKhusus, totalTagihan: 0 });
			}
			grouped.get(key).totalTagihan += Number(item.nominalTagihan || 0);
		}

		return Array.from(grouped.values())
			.map((item) => {
				const totalDibayar = (data.pembayaranReguler || [])
					.filter((payment) =>
						payment.santriId == selectedSantriId &&
						payment.tahunAjaranId == selectedTahunAjaranId &&
						payment.jenisPembayaranId == data.khususJenisId &&
						String(payment.keteranganKhusus || '').trim().toLowerCase() === item.label.trim().toLowerCase()
					)
					.reduce((sum, payment) => sum + Number(payment.nominalDibayar || 0), 0);
				return {
					...item,
					totalDibayar,
					sisa: Math.max(0, item.totalTagihan - totalDibayar)
				};
			})
			.filter((item) => item.sisa > 0)
			.sort((a, b) => a.label.localeCompare(b.label, 'id'));
	});

	// Auto-fill nominal ketika memilih jenis pembayaran & santri
	$effect(() => {
		if (isKhusus) return; // Jangan auto-fill untuk pembayaran khusus
		if (!selectedJenis) return;

		if (isGratis) {
			nominal = 0;
			return;
		}

		if ((isBulanan || isTahunan || isSekali) && selectedPaymentStatus) {
			nominal = selectedPaymentStatus.sisa;
			return;
		}

		nominal = nominalEfektif;
	});

	// Reset state ketika toggle khusus berubah
	$effect(() => {
		if (isKhusus) {
			selectedJenisId = '';
			selectedBulan = '';
			selectedTahunTagihan = '';
			nominal = 0;
			keteranganKhusus = '';
		} else {
			keteranganKhusus = '';
			namaPembayarManual = '';
		}
	});

	$effect(() => {
		if (!isBulanan) {
			selectedTahunTagihan = '';
			return;
		}

		const nextDefault = inferDefaultTahunTagihan(selectedTahunAjaran?.nama, selectedBulan);
		if (!selectedTahunTagihan || !tahunTagihanOptions.includes(Number(selectedTahunTagihan))) {
			selectedTahunTagihan = nextDefault;
		}
	});

	function buildCurrentPaymentItem() {
		if (!selectedTahunAjaranId) return null;
		if (isKhusus) {
			if ((!selectedSantriId && !namaPembayarManual.trim()) || !keteranganKhusus.trim() || nominal <= 0) return null;
			return {
				santriId: selectedSantriId || '',
				tahunAjaranId: selectedTahunAjaranId,
				jenisPembayaranId: data.khususJenisId,
				nominalDibayar: Number(nominal || 0),
				bulan: '',
				tahunTagihan: '',
				keteranganKhusus: keteranganKhusus.trim(),
				namaPembayarManual: namaPembayarManual.trim(),
				label: keteranganKhusus.trim(),
				periode: ''
			};
		}

		if (!selectedSantriId || !selectedJenisId) return null;
		if (isBulanan && (!selectedBulan || !selectedTahunTagihan)) return null;
		if (selectedPaymentStatus?.isLunas) return null;
		if (nominal <= 0 && !isGratis) return null;

		return {
			santriId: selectedSantriId,
			tahunAjaranId: selectedTahunAjaranId,
			jenisPembayaranId: selectedJenisId,
			nominalDibayar: Number(nominal || 0),
			bulan: selectedBulan || '',
			tahunTagihan: selectedTahunTagihan || '',
			keteranganKhusus: '',
			namaPembayarManual: '',
			label: selectedJenis?.namaPembayaran || 'Pembayaran',
			periode: isBulanan ? `${selectedBulan} ${selectedTahunTagihan}` : (selectedTahunAjaran?.nama || '')
		};
	}

	function resetDraft() {
		selectedJenisId = '';
		selectedBulan = '';
		selectedTahunTagihan = '';
		nominal = 0;
		isKhusus = false;
		keteranganKhusus = '';
		namaPembayarManual = '';
	}

	function addCurrentPaymentItem() {
		batchError = '';
		const item = buildCurrentPaymentItem();
		if (!item) {
			batchError = 'Lengkapi item pembayaran terlebih dahulu sebelum ditambahkan.';
			return;
		}

		if (paymentItems.length > 0) {
			const first = paymentItems[0];
			if (String(first.santriId || '') !== String(item.santriId || '') || String(first.tahunAjaranId) !== String(item.tahunAjaranId)) {
				batchError = 'Multi payment harus untuk santri dan tahun ajaran yang sama.';
				return;
			}
		}

		const duplicate = paymentItems.some((existing) =>
			String(existing.jenisPembayaranId) === String(item.jenisPembayaranId) &&
			String(existing.bulan || '') === String(item.bulan || '') &&
			String(existing.tahunTagihan || '') === String(item.tahunTagihan || '') &&
			String(existing.keteranganKhusus || '') === String(item.keteranganKhusus || '')
		);
		if (duplicate) {
			batchError = 'Item pembayaran ini sudah ada di daftar.';
			return;
		}

		paymentItems = [...paymentItems, item];
		resetDraft();
	}

	function removePaymentItem(index) {
		paymentItems = paymentItems.filter((_, idx) => idx !== index);
	}

	function validateFormBeforeSubmit() {
		console.log('🔍 Validasi form dimulai. paymentItems:', paymentItems.length, 'tahunAjaran:', selectedTahunAjaranId);
		
		// Validasi tahun ajaran (wajib untuk semua kasus)
		if (!selectedTahunAjaranId) {
			console.log('❌ Validasi gagal: Tahun ajaran belum dipilih');
			alert('Pilih tahun ajaran terlebih dahulu.');
			return false;
		}

		// Jika sudah ada items di list, semua validasi sudah dilakukan saat ditambahkan
		if (paymentItems.length > 0) {
			console.log('✅ Validasi berhasil: Ada', paymentItems.length, 'item dalam batch');
			return true;
		}

		// Validasi untuk single item (belum ditambahkan ke list)
		if (isKhusus) {
			if (!selectedSantriId && !namaPembayarManual.trim()) {
				console.log('❌ Validasi gagal: Khusus - santri atau pembayar tidak dipilih');
				alert('Pilih santri atau masukkan nama pembayar.');
				return false;
			}
			if (!keteranganKhusus.trim()) {
				console.log('❌ Validasi gagal: Khusus - keterangan kosong');
				alert('Masukkan keterangan pembayaran.');
				return false;
			}
			if (nominal <= 0) {
				console.log('❌ Validasi gagal: Khusus - nominal invalid');
				alert('Nominal harus lebih dari 0.');
				return false;
			}
			console.log('✅ Validasi berhasil: Item khusus valid');
			return true;
		}

		// Validasi untuk pembayaran reguler
		if (!selectedSantriId) {
			console.log('❌ Validasi gagal: Santri belum dipilih');
			alert('Pilih santri.');
			return false;
		}
		if (!selectedJenisId) {
			console.log('❌ Validasi gagal: Jenis pembayaran belum dipilih');
			alert('Pilih jenis pembayaran.');
			return false;
		}
		if (isBulanan && (!selectedBulan || !selectedTahunTagihan)) {
			console.log('❌ Validasi gagal: Bulanan - bulan atau tahun tidak dipilih');
			alert('Pilih bulan dan tahun tagihan untuk pembayaran bulanan.');
			return false;
		}
		if (nominal <= 0 && !isGratis) {
			console.log('❌ Validasi gagal: Nominal invalid');
			alert('Nominal harus lebih dari 0.');
			return false;
		}

		console.log('✅ Validasi berhasil: Item reguler valid');
		return true;
	}

</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Form Input Start -->
	<div class="lg:col-span-2">
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h2 class="card-title text-2xl mb-6 flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
					Input Pembayaran Baru
				</h2>

				{#if form?.success === false}
					<div class="alert alert-error mb-4">
						<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2M19 6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						<span>{form.message}</span>
					</div>
				{/if}
				
				<form method="POST" action="?/create" use:enhance={async ({ cancel }) => {
					console.log('📝 Form submission attempt. Validation check...');
					if (!validateFormBeforeSubmit()) {
						console.log('❌ Validasi gagal, form submission dibatalkan');
						cancel();
						return;
					}
					console.log('✅ Validasi passed, submitting form with', paymentItems.length, 'items');
					isSubmitting = true;
					return async ({ result, update }) => {
						console.log('📨 Form response received:');
						console.log('  - result.type:', result.type);
						console.log('  - result.status:', result.status);
						console.log('  - result.data:', result.data);
						console.log('  - Full result:', result);
						isSubmitting = false;
						
						if (result.type === 'success' && result.data?.id) {
							console.log('🎉 Transaction saved successfully, id:', result.data.id);
							await goto(`/transaksi/cetak/${result.data.id}`, { replaceState: true });
							return;
						}

						if (result.type === 'success') {
							console.log('⚠️ Success but no transaction id. result.data:', result.data);
							// Jika sukses tapi tanpa id, bersihkan state & refresh data
							selectedSantriId = '';
							selectedTahunAjaranId = '';
							selectedBulan = '';
							selectedTahunTagihan = '';
							selectedJenisId = '';
							nominal = 0;
							isKhusus = false;
							keteranganKhusus = '';
							namaPembayarManual = '';
							paymentItems = [];
							batchError = '';
							await invalidateAll();
							return;
						}

						console.log('❌ Form submission failed');
						await update();
					};
				}}>
					<input type="hidden" name="paymentItemsJson" value={paymentItemsJson} />
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- Pilih Santri -->
						<div class="form-control w-full">
							<label for="santriId" class="label"><span class="label-text font-medium">Santri</span></label>
							<input id="santriSearch" name="santriSearch" type="text" placeholder="Cari nama atau nomor induk..." class="input input-bordered w-full mb-2" bind:value={santriSearch} />
							<select id="santriId" name="santriId" class="select select-bordered w-full" bind:value={selectedSantriId}>
								<option value="" selected>Pilih Santri...</option>
								{#each filteredSantris as santri}
									<option value={santri.id}>
										{santri.nomorInduk} - {santri.namaLengkap} ({santri.namaKategori || 'Tanpa Kategori'})
									</option>
								{/each}
							</select>
							{#if santriSearch && filteredSantris.length === 0}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-base-content/60">Tidak ada santri yang cocok.</span>
								</div>
							{/if}
							{#if isKhusus}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-base-content/60">Opsional. Kosongkan jika pembayar tidak ada di daftar santri.</span>
								</div>
							{/if}
						</div>

						<!-- Pilih Tahun -->
						<div class="form-control w-full">
							<label for="tahunAjaranId" class="label"><span class="label-text font-medium">Tahun</span></label>
							<select id="tahunAjaranId" name="tahunAjaranId" class="select select-bordered w-full" bind:value={selectedTahunAjaranId} required>
								{#each data.tahunAjarans as ta}
									<option value={ta.id} selected={ta.isActive}>{ta.nama}</option>
								{/each}
							</select>
						</div>

						<!-- Toggle Pembayaran Lain-lain -->
						<div class="form-control w-full md:col-span-2">
							<label class="label cursor-pointer justify-start gap-3" for="isKhusus">
								<input id="isKhusus" name="isKhusus" type="checkbox" class="toggle toggle-warning" bind:checked={isKhusus} />
								<span class="label-text font-medium">Pembayaran Lain-lain</span>
								<span class="label-text-alt text-base-content/50">(Tentukan sendiri jenis & nominal)</span>
							</label>
						</div>

						{#if isKhusus}
							<!-- Mode Pembayaran Lain-lain -->
							<input type="hidden" name="jenisPembayaranId" value={data.khususJenisId} />

							<div class="form-control w-full md:col-span-2 bg-warning/5 p-4 rounded-xl border border-warning/20">
								<label for="namaPembayarManual" class="label"><span class="label-text font-medium text-warning">Nama Pembayar</span></label>
								<input
									id="namaPembayarManual"
									type="text"
									name="namaPembayarManual"
									placeholder="Isi jika pembayar tidak ada di daftar santri"
									class="input input-bordered w-full mb-2"
									bind:value={namaPembayarManual}
									disabled={!!selectedSantriId}
									required={!selectedSantriId}
								/>
								<div class="label pt-0 pb-2">
									<span class="label-text-alt text-base-content/50">
										{selectedSantriId
											? 'Transaksi akan memakai nama santri yang dipilih.'
											: 'Jika nama belum ada di data santri, sistem akan menyimpannya sebagai pembayar umum.'}
									</span>
								</div>
								<label for="keteranganKhusus" class="label"><span class="label-text font-medium text-warning">Untuk Pembayaran</span></label>
								<input
									id="keteranganKhusus"
									type="text"
									name="keteranganKhusus"
									placeholder="Contoh: Seragam baru, Biaya wisuda, Denda keterlambatan..."
									class="input input-bordered w-full"
									bind:value={keteranganKhusus}
								/>
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-base-content/50">Tuliskan deskripsi untuk pembayaran ini</span>
								</div>
								{#if importedCustomOptions.length > 0}
									<div class="mt-4">
										<div class="text-xs font-semibold text-base-content/70 mb-2">Referensi tunggakan custom yang masih tersisa</div>
										<div class="flex flex-wrap gap-2">
											{#each importedCustomOptions as item}
												<button
													type="button"
													class="btn btn-xs btn-outline btn-warning"
													onclick={() => {
														keteranganKhusus = item.label;
														nominal = item.sisa;
													}}
												>
													{item.label} · {formatRupiah(item.sisa)}
												</button>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<!-- Pilih Jenis Tagihan (Mode Normal) -->
							<div class="form-control w-full md:col-span-2">
								<label for="jenisPembayaranId" class="label"><span class="label-text font-medium">Jenis Pembayaran</span></label>
								<select id="jenisPembayaranId" name="jenisPembayaranId" class="select select-bordered w-full" bind:value={selectedJenisId}>
									<option value="" disabled selected>Pilih Tagihan...</option>
									{#each data.jenisPembayarans.filter(jp => jp.namaPembayaran !== 'Pembayaran Lain-lain') as jp}
										<option value={jp.id}>
											{jp.namaPembayaran} (
												{jp.tipe === 'bulanan' ? 'Bulanan' :
												jp.tipe === 'tahunan' ? 'Tahunan' :
												jp.tipe === 'sekali' ? 'Sekali' :
												jp.tipe === 'smk_bulanan' ? 'SMK Bulanan' :
												jp.tipe === 'smk_tahunan' ? 'SMK Tahunan' :
												jp.tipe === 'smk_sekali' ? 'SMK Sekali' :
												jp.tipe === 'smp_bulanan' ? 'SMP Bulanan' :
												jp.tipe === 'smp_tahunan' ? 'SMP Tahunan' :
												jp.tipe === 'smp_sekali' ? 'SMP Sekali' : jp.tipe}
											)
										</option>
									{/each}
								</select>
							</div>
						{/if}

						<!-- Pilihan Bulan (Jika Bulanan) -->
						{#if isBulanan}
							<div class="form-control w-full md:col-span-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="bulan" class="label"><span class="label-text font-medium text-primary">Bayar Untuk Bulan</span></label>
										<select id="bulan" name="bulan" class="select select-bordered w-full" bind:value={selectedBulan}>
									<option value="" disabled selected>Pilih Bulan...</option>
									<option value="Januari">Januari</option>
									<option value="Februari">Februari</option>
									<option value="Maret">Maret</option>
									<option value="April">April</option>
									<option value="Mei">Mei</option>
									<option value="Juni">Juni</option>
									<option value="Juli">Juli</option>
									<option value="Agustus">Agustus</option>
									<option value="September">September</option>
									<option value="Oktober">Oktober</option>
									<option value="November">November</option>
									<option value="Desember">Desember</option>
										</select>
									</div>
									<div>
										<label for="tahunTagihan" class="label"><span class="label-text font-medium text-primary">Tahun Tagihan</span></label>
										<select
											id="tahunTagihan"
											name="tahunTagihan"
											class="select select-bordered w-full"
											bind:value={selectedTahunTagihan}
										>
											<option value="" disabled selected>Pilih Tahun...</option>
											{#each tahunTagihanOptions as tahun}
												<option value={String(tahun)}>{tahun}</option>
											{/each}
										</select>
									</div>
								</div>
								{#if selectedBulan && (selectedSantriId && selectedTahunAjaranId && selectedJenisId)}
									{#if isBulanLunas}
										<div class="label pt-2 pb-0">
											<span class="label-text-alt text-success font-medium">✓ Bulan dan tahun tagihan ini sudah lunas</span>
										</div>
									{:else}
										<div class="label pt-2 pb-0">
											<span class="label-text-alt text-base-content/60">Status pembayaran: masih ada sisa tagihan untuk periode ini</span>
										</div>
									{/if}
								{:else}
									<div class="label pt-2 pb-0">
										<span class="label-text-alt text-base-content/60">Sistem akan memvalidasi apakah bulan ini sudah lunas atau belum (Fitur lanjutan).</span>
									</div>
								{/if}
							</div>
						{/if}

						<div class="form-control w-full md:col-span-2">
							<label for="nominalDibayar" class="label"><span class="label-text font-medium">Nominal Pembayaran (Rp)</span></label>
							<input
								id="nominalDibayar"
								type="number"
								name="nominalDibayar"
								bind:value={nominal}
								class="input input-bordered w-full font-bold text-lg"
								min={isGratis ? 0 : 1}
								max={(isTahunan || isSekali) && selectedPaymentStatus ? selectedPaymentStatus.sisa : undefined}
								readonly={!isKhusus && !isTahunan && !isSekali}
							/>
							{#if nominal <= 0 && !isGratis && !isKhusus && paymentItems.length === 0}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-error">Nominal harus lebih dari 0</span>
								</div>
							{/if}
							{#if isKhusus && nominal <= 0 && paymentItems.length === 0}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-error">Nominal pembayaran lain-lain harus lebih dari 0</span>
								</div>
							{/if}
							{#if isGratis}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-success font-medium">✨ Pembayaran ini GRATIS untuk kategori santri {selectedSantri?.namaKategori}</span>
								</div>
							{/if}
							{#if !isKhusus && isBulanan}
								<div class="label pt-2 pb-0">
									<span class="label-text-alt text-base-content/60">Nominal bulanan otomatis mengikuti sisa tagihan bulan ini, termasuk hasil import tunggakan.</span>
								</div>
							{/if}
							{#if !isKhusus && isBulanan && selectedPaymentStatus}
								<div class="label pt-1 pb-0">
									<span class={`label-text-alt font-medium ${selectedPaymentStatus.isLunas ? 'text-success' : 'text-base-content/70'}`}>
										Tagihan: {selectedPaymentStatus.totalTagihan.toLocaleString('id-ID')} ·
										Sudah dibayar: {selectedPaymentStatus.totalDibayar.toLocaleString('id-ID')} ·
										Sisa: {selectedPaymentStatus.sisa.toLocaleString('id-ID')}
									</span>
								</div>
							{/if}
							{#if !isKhusus && isSekali && selectedPaymentStatus}
								<div class="label pt-2 pb-0">
									<span class={`label-text-alt font-medium ${selectedPaymentStatus.isLunas ? 'text-success' : 'text-base-content/70'}`}>
										Tagihan: {selectedPaymentStatus.totalTagihan.toLocaleString('id-ID')} ·
										Sudah dibayar: {selectedPaymentStatus.totalDibayar.toLocaleString('id-ID')} ·
										Sisa: {selectedPaymentStatus.sisa.toLocaleString('id-ID')}
									</span>
								</div>
							{/if}
							{#if !isKhusus && isTahunan && selectedPaymentStatus}
								<div class="label pt-2 pb-0">
									<span class={`label-text-alt font-medium ${selectedPaymentStatus.isLunas ? 'text-success' : 'text-base-content/70'}`}>
										Tagihan: {selectedPaymentStatus.totalTagihan.toLocaleString('id-ID')} ·
										Sudah dibayar: {selectedPaymentStatus.totalDibayar.toLocaleString('id-ID')} ·
										Sisa: {selectedPaymentStatus.sisa.toLocaleString('id-ID')}
									</span>
								</div>
							{/if}
						</div>
					</div>

					<div class="divider"></div>

					{#if batchError}
						<div class="alert alert-warning mb-4 py-2 text-sm">
							<span>{batchError}</span>
						</div>
					{/if}

					<div class="card bg-base-200/40 border border-base-200 mb-4">
						<div class="card-body p-4">
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
								<div>
									<h3 class="font-semibold">Multi Payment</h3>
									<p class="text-xs text-base-content/60">Tambahkan beberapa item pembayaran lalu simpan sekali untuk satu kwitansi.</p>
								</div>
								<button type="button" class="btn btn-sm btn-outline btn-primary" onclick={addCurrentPaymentItem}>
									Tambah ke Daftar
								</button>
							</div>

							{#if paymentItems.length === 0}
								<div class="text-sm text-base-content/60">Belum ada item di daftar. Anda masih bisa langsung simpan 1 item tanpa menambahkannya ke daftar.</div>
							{:else}
								<div class="overflow-x-auto">
									<table class="table table-sm w-full">
										<thead>
											<tr class="bg-base-100">
												<th>Uraian</th>
												<th>Periode</th>
												<th class="text-right">Nominal</th>
												<th class="text-center">Aksi</th>
											</tr>
										</thead>
										<tbody>
											{#each paymentItems as item, index}
												<tr>
													<td class="font-medium">{item.label}</td>
													<td class="text-xs text-base-content/60">{item.periode || '-'}</td>
													<td class="text-right font-semibold">{formatRupiah(item.nominalDibayar)}</td>
													<td class="text-center">
														<button type="button" class="btn btn-xs btn-ghost text-error" onclick={() => removePaymentItem(index)}>
															Hapus
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
										<tfoot>
											<tr class="font-semibold">
												<td colspan="2" class="text-right">Total</td>
												<td class="text-right text-primary">{formatRupiah(totalPaymentItems)}</td>
												<td></td>
											</tr>
										</tfoot>
									</table>
								</div>
							{/if}
						</div>
					</div>
					
					<div class="flex justify-end gap-3 mt-4">
						<button type="reset" class="btn btn-ghost" disabled={isSubmitting}>Reset Form</button>
						<button type="submit" class="btn btn-primary px-8" disabled={!isFormValid || isSubmitting}>
							{#if isSubmitting}
								<span class="loading loading-spinner loading-sm"></span>
								Memproses...
							{:else}
								{paymentItems.length > 0 ? `Simpan ${paymentItems.length} Item & Cetak` : 'Simpan & Cetak Kwitansi'}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>

	<!-- Sidebar Kanan (Riwayat Singkat) -->
	<div class="lg:col-span-1">
		<!-- Preview Pembayaran yang Akan Dicetak -->
		{#if paymentItems.length > 0}
		<div class="card bg-linear-to-br from-primary/10 to-primary/5 shadow-md border-2 border-primary mb-4 sticky top-24">
			<div class="card-body">
				<h3 class="card-title text-lg mb-3 flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
					Siap Dicetak
				</h3>
				<div class="bg-base-100/80 rounded-lg p-3 mb-3">
					<div class="text-sm mb-2">
						<span class="label-text font-semibold">Santri / Pembayar:</span>
						<div class="font-bold text-base mt-1">{selectedSantri?.namaLengkap || (namaPembayarManual || 'Pembayar Umum')}</div>
						{#if selectedSantri}
							<div class="text-xs text-base-content/60 mt-1">{selectedSantri.nomorInduk}</div>
						{/if}
					</div>
					<div class="divider my-2"></div>
					<div class="text-sm">
						<span class="label-text font-semibold">Tahun Ajaran:</span>
						<div class="font-medium mt-1">{selectedTahunAjaran?.nama || '-'}</div>
					</div>
				</div>

				<div class="text-sm font-semibold mb-2">Item Pembayaran:</div>
				<div class="bg-base-100/60 rounded-lg p-2 mb-3 max-h-48 overflow-y-auto">
					<table class="w-full text-xs">
						<tbody>
							{#each paymentItems as item, idx}
								<tr class="border-b border-base-200/50 last:border-b-0">
									<td class="py-2 pr-2">
										<div class="font-medium text-base-content">{item.label}</div>
										{#if item.periode}
											<div class="text-base-content/60 text-xs">{item.periode}</div>
										{/if}
									</td>
									<td class="text-right py-2 whitespace-nowrap font-semibold">
										{formatRupiah(item.nominalDibayar)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="bg-primary/20 rounded-lg p-3 mb-3">
					<div class="flex justify-between items-center">
						<span class="font-semibold text-lg">Total:</span>
						<span class="text-2xl font-bold text-primary">{formatRupiah(totalPaymentItems)}</span>
					</div>
				</div>

				<div class="badge badge-outline badge-lg w-full text-center py-3">
					{paymentItems.length} item akan dicetak satu kwitansi
				</div>
			</div>
		</div>
		{/if}

		<div class="card bg-base-100 shadow-sm border border-base-200 sticky top-24">
			<div class="card-body">
				<h3 class="card-title text-lg mb-4">Riwayat Terakhir</h3>
				<ul class="steps steps-vertical space-y-4">
					{#each data.riwayatData.slice(0, 5) as r}
						<li class="step step-primary">
							<div class="text-left py-1">
								<div class="font-bold text-sm">{r.nomorKwitansi}</div>
								<div class="text-xs text-base-content/60 mt-1">{r.namaSantri || r.namaPembayarLain || 'Pembayar tidak diketahui'}</div>
								<div class="text-xs text-base-content/70 mt-1 mb-1">Rp {r.nominalDibayar.toLocaleString('id')}</div>
								<div class="text-xs font-mono">{new Date(r.tanggalBayar).toLocaleDateString()}</div>
								{#if r.keteranganKhusus}
									<div class="text-xs text-warning mt-1">📌 {r.keteranganKhusus}</div>
								{/if}
							</div>
						</li>
					{/each}
					{#if data.riwayatData.length === 0}
						<div class="text-sm text-center text-base-content/50 py-4">Belum ada transaksi</div>
					{/if}
				</ul>
			</div>
		</div>
	</div>
</div>
