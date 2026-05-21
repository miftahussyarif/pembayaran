<script>
	import { savingState } from '$lib/stores/saving.js';

	const state = $derived($savingState);
	const visible = $derived(state === 'saving' || state === 'done');
</script>

{#if visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="save-indicator-overlay"
		class:done={state === 'done'}
		aria-live="polite"
		aria-label={state === 'saving' ? 'Menyimpan data...' : 'Tersimpan!'}
	>
		<div class="save-indicator-box">
			{#if state === 'saving'}
				<div class="save-icon-wrapper saving">
					<span class="loading loading-spinner loading-md text-primary"></span>
				</div>
				<div class="save-texts">
					<span class="save-title">Menyimpan data...</span>
					<span class="save-subtitle">Mohon tunggu sebentar</span>
				</div>
			{:else}
				<div class="save-icon-wrapper done">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div class="save-texts">
					<span class="save-title done">Tersimpan!</span>
					<span class="save-subtitle">Data berhasil disimpan</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.save-indicator-overlay {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 9999;
		animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	.save-indicator-overlay.done .save-indicator-box {
		border-color: oklch(var(--su) / 0.3);
		background: oklch(var(--su) / 0.06);
	}

	.save-indicator-box {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem 0.75rem 0.875rem;
		background: var(--fallback-b1, oklch(var(--b1)));
		border: 1px solid oklch(var(--b3));
		border-radius: 1rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.07),
			0 10px 15px -3px rgba(0, 0, 0, 0.06);
		min-width: 210px;
		transition: background 0.3s, border-color 0.3s;
	}

	.save-icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		flex-shrink: 0;
		transition: background 0.3s;
	}

	.save-icon-wrapper.saving {
		background: oklch(var(--p) / 0.1);
	}

	.save-icon-wrapper.done {
		background: oklch(var(--su) / 0.12);
		animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	.save-texts {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.save-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: oklch(var(--bc));
		line-height: 1.25;
	}

	.save-title.done {
		color: oklch(var(--su));
	}

	.save-subtitle {
		font-size: 0.72rem;
		color: oklch(var(--bc) / 0.5);
		line-height: 1.2;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(1rem) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes popIn {
		from {
			transform: scale(0.5);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
