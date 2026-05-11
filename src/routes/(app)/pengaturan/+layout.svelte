<script>
	import { page } from '$app/stores';
	let { children } = $props();
</script>

<div class="p-6">

	<!-- Konten -->
	{@render children()}
</div>
