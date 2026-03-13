<script>
	import { enhance } from '$app/forms';
	export let data;
	export let form;

	const downloadUrl = '/pengaturan/backup-database/download.json';

	let loading = false;
	let testLoading = false;
</script>

<div class="mb-6">
	<h2 class="text-2xl font-bold">Backup Database</h2>
	<p class="text-sm text-base-content/60">Backup data master, transaksi, mutasi saldo, dan system log.</p>
</div>

{#if form}
	<div class="alert {form.success ? 'alert-success' : 'alert-error'} mb-6">
		<span>{form.message}</span>
	</div>
{/if}

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h3 class="card-title mb-4">Manual Backup</h3>
			<div class="alert alert-info mb-4">
				<span>File backup berisi data master, transaksi, mutasi saldo, dan system log.</span>
			</div>
			<a class="btn btn-primary" href={downloadUrl} target="_blank" rel="noopener">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
				</svg>
				Download Backup
			</a>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h3 class="card-title mb-4">Otomatisasi Telegram</h3>
			<p class="text-sm text-base-content/60 mb-4">Setup bot Telegram untuk mengirim backup otomatis setiap jam 12:00.</p>
			
			<form method="POST" action="?/saveSettings" use:enhance={() => {
				loading = true;
				testLoading = true; // Use testLoading for any action to prevent multiple clicks
				return async ({ update }) => {
					loading = false;
					testLoading = false;
					update();
				};
			}}>
				<div class="form-control w-full mb-4">
					<label class="label" for="botToken">
						<span class="label-text font-semibold">Token Bot Telegram</span>
					</label>
					<input 
						type="text" 
						id="botToken"
						name="botToken" 
						placeholder="123456789:ABCDE..." 
						class="input input-bordered w-full" 
						value={data.pengaturan?.telegramBotToken || ''}
					/>
				</div>
				
				<div class="form-control w-full mb-6">
					<label class="label" for="chatId">
						<span class="label-text font-semibold">Chat ID Penerima</span>
					</label>
					<input 
						type="text" 
						id="chatId"
						name="chatId" 
						placeholder="-100123456789" 
						class="input input-bordered w-full" 
						value={data.pengaturan?.telegramChatId || ''}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
					</button>
					
					<div class="divider text-xs text-base-content/40">Tindakan Manual</div>

					<button 
						type="submit" 
						formaction="?/backupNow" 
						class="btn btn-secondary w-full" 
						disabled={testLoading || !data.pengaturan?.telegramBotToken}
					>
						{#if testLoading}
							<span class="loading loading-spinner loading-xs"></span>
							Mengirim...
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
							</svg>
							Backup ke Telegram Sekarang
						{/if}
					</button>

					<button 
						type="submit" 
						formaction="?/testTelegram" 
						class="btn btn-ghost btn-sm" 
						disabled={testLoading || !data.pengaturan?.telegramBotToken}
					>
						Tes Koneksi Bot
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
