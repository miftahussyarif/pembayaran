<script>
	import { enhance } from '$app/forms';
	
	let { form } = $props();
	let isSubmitting = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4 font-sans relative overflow-hidden">
	<!-- Background pattern/gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900 z-0"></div>
	<div
		class="absolute inset-0 opacity-10"
		style={"background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%23fff' fill-opacity='0.1'/%3E%3Cpath d='M0 0L8 8' stroke='%23fff' stroke-width='1' stroke-opacity='0.1'/%3E%3C/svg%3E\");"}
	></div>

	<div class="card w-full max-w-md bg-base-100 shadow-2xl relative z-10 rounded-[2rem] border border-white/10 m-4">
		
		<div class="p-8 lg:p-10 flex flex-col justify-center relative">
			<div class="mb-8 text-center">
				<div class="inline-flex w-16 h-16 rounded-2xl bg-warning/10 text-warning items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
				</div>
				<h2 class="text-2xl font-bold text-base-content mb-2 leading-tight">Security Landing</h2>
				<p class="text-sm text-base-content/60">Kode OTP 5 digit telah dikirim ke Telegram Anda. Masukkan untuk melanjutkan.</p>
			</div>

			<form method="POST" action="?/verify" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}}>
				<div class="form-control w-full mb-6">
					<label class="label pb-1" for="otp">
						<span class="label-text text-sm font-semibold text-base-content/70">Kode OTP</span>
					</label>
					<input type="text" id="otp" name="otp" autocomplete="off" placeholder="XXXXX" maxlength="5" class="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-center text-2xl font-mono tracking-widest uppercase" required />
				</div>

				{#if form?.error}
					<div class="alert alert-error text-sm rounded-xl py-2 mb-6 shadow-sm">
						<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						<span>{form.error}</span>
					</div>
				{/if}

				<button type="submit" class="btn btn-warning w-full shadow-md text-warning-content rounded-xl h-12 font-bold tracking-wide mt-2" disabled={isSubmitting}>
					{#if isSubmitting}
						<span class="loading loading-spinner"></span> Memverifikasi...
					{:else}
						Verifikasi Kode
					{/if}
				</button>
				<div class="mt-4 text-center">
					<a href="/login" class="text-sm text-base-content/60 hover:text-primary transition-colors">Kembali ke halaman Login</a>
				</div>
			</form>
		</div>
	</div>
</div>
