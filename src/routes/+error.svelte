<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let countdown = $state(5);

	onMount(() => {
		// Attempt to use a global toast if it exists, otherwise just show the error on screen.
		// Since we want a "popup", we can render a modal here.
		
		const timer = setInterval(() => {
			countdown -= 1;
			if (countdown <= 0) {
				clearInterval(timer);
				// Go back to the previous page or dashboard
				if (window.history.length > 2) {
					window.history.back();
				} else {
					goto('/');
				}
			}
		}, 1000);

		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<title>Error {page.status}</title>
</svelte:head>

<!-- Menampilkan popup / alert error di layar -->
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
	<div class="card bg-base-100 w-full max-w-md shadow-2xl scale-100">
		<div class="card-body items-center text-center">
			<div class="text-error mb-2">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<h2 class="card-title text-2xl font-bold">Terjadi Kesalahan!</h2>
			<p class="text-base-content/70 mt-2">{page.error?.message || 'Sistem mengalami gangguan saat memproses permintaan Anda.'}</p>
			
			<div class="mt-6 w-full">
				<p class="text-xs text-base-content/50 mb-4">Akan dialihkan kembali dalam {countdown} detik...</p>
				<button class="btn btn-primary w-full" onclick={() => {
					if (window.history.length > 2) {
						window.history.back();
					} else {
						goto('/');
					}
				}}>
					Kembali Sekarang
				</button>
			</div>
		</div>
	</div>
</div>
