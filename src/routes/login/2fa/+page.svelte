<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { form } = $props();
	let isSubmitting = $state(false);

	const namaPesantren = $derived(page.data?.profilPesantren?.namaPesantren || 'Pesantren Al-Hikmah');
	const alamat = $derived(page.data?.profilPesantren?.alamat || '');
	const logoUrl = $derived(page.data?.profilPesantren?.logoUrl || '');
</script>

<!-- Hero Section — same style as /public and /login -->
<div class="relative overflow-hidden">
	<!-- Animated Background -->
	<div class="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900"></div>
	<div class="absolute inset-0 opacity-20" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%224%22 height=%224%22 patternUnits=%22userSpaceOnUse%22><circle cx=%222%22 cy=%222%22 r=%220.5%22 fill=%22white%22 opacity=%220.3%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>');"></div>

	<!-- Floating orbs -->
	<div class="absolute top-20 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
	<div class="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
	<div class="absolute top-40 right-1/4 w-48 h-48 bg-teal-300/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 2s;"></div>

	<div class="relative z-10 px-4 py-16 md:py-20 text-center">
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
	</div>
</div>

<!-- 2FA Card — overlaps hero -->
<div class="relative -mt-12 z-20 px-4 pb-16">
	<div class="max-w-md mx-auto">
		<div class="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 md:p-8">

			<!-- Card Header -->
			<div class="text-center mb-6">
				<div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<h2 class="text-xl md:text-2xl font-bold text-gray-800">Verifikasi Keamanan</h2>
				<p class="text-gray-500 text-sm mt-1">Kode OTP 5 digit telah dikirim ke Telegram Anda.<br/>Masukkan kode untuk melanjutkan.</p>
			</div>

			<!-- Error Alert -->
			{#if form?.error}
				<div class="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-5 animate-shake">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- Form -->
			<form method="POST" action="?/verify" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}} class="space-y-4">

				<!-- OTP Input -->
				<div>
					<label class="block text-sm font-semibold text-gray-600 mb-1.5" for="otp">Kode OTP</label>
					<input
						type="text"
						id="otp"
						name="otp"
						autocomplete="off"
						placeholder="X X X X X"
						maxlength="5"
						class="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all duration-300 bg-gray-50 hover:bg-white placeholder:text-gray-300 text-gray-800 text-center text-3xl font-mono tracking-[0.5em] uppercase"
						required
					/>
				</div>

				<!-- Submit -->
				<button
					type="submit"
					id="btn-verify-otp"
					disabled={isSubmitting}
					class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
				>
					{#if isSubmitting}
						<span class="inline-flex items-center justify-center gap-2">
							<span class="loading loading-spinner loading-sm"></span>
							Memverifikasi...
						</span>
					{:else}
						Verifikasi Kode
					{/if}
				</button>

			</form>

			<!-- Back link -->
			<div class="mt-5 text-center">
				<a href="/login" class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 transition-colors duration-200">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Kembali ke halaman Login
				</a>
			</div>
		</div>
	</div>
</div>

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
