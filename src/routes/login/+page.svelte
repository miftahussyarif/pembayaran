<script>
	import { enhance } from '$app/forms';
	
	let { form } = $props();
	let role = $state('admin');
	let isSubmitting = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4 font-sans relative overflow-hidden">
	<!-- Background pattern/gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900 z-0"></div>
	<div class="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFoiIHN0cm9rZT0iI2ZmZiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSI+PC9wYXRoPgo8L3N2Zz4=')]"></div>

	<div class="card w-full max-w-md bg-base-100 shadow-2xl relative z-10 rounded-[2rem] border border-white/10 m-4">
		
		<div class="p-8 lg:p-10 flex flex-col justify-center relative">
			<div class="mb-8 text-center">
				<div class="inline-flex w-16 h-16 rounded-2xl bg-primary/10 text-primary items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
				</div>
				<h2 class="text-2xl font-bold text-base-content mb-2 leading-tight">Pendataan Keuangan <br/><span class="text-primary">Pesantren</span></h2>
				<p class="text-sm text-base-content/60">Silakan masuk menggunakan kredensial Anda.</p>
			</div>

			<form method="POST" action="?/login" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}}>
				<div class="form-control w-full mb-4">
					<label class="label pb-1" for="username">
						<span class="label-text text-sm font-semibold text-base-content/70">Username</span>
					</label>
					<input type="text" id="username" name="username" placeholder="Masukkan Username..." class="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-xl" required />
				</div>

				<div class="form-control w-full mb-6">
					<label class="label pb-1" for="password">
						<span class="label-text text-sm font-semibold text-base-content/70">Password</span>
					</label>
					<div class="relative w-full">
						<input type="password" id="password" name="password" placeholder="••••••••" class="input input-bordered w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pr-12" required />
						<div class="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
						</div>
					</div>
				</div>

				{#if form?.error}
					<div class="alert alert-error text-sm rounded-xl py-2 mb-6 shadow-sm">
						<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						<span>{form.error}</span>
					</div>
				{/if}

				<button type="submit" class="btn btn-primary w-full shadow-md text-white rounded-xl h-12 font-bold tracking-wide mt-2" disabled={isSubmitting}>
					{#if isSubmitting}
						<span class="loading loading-spinner"></span> Memproses...
					{:else}
						Masuk Aplikasi
					{/if}
				</button>
			</form>
			
		</div>
	</div>
</div>
