<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	
	let loading = $state(false);

	let rules = $state(data.rules);
	
	$effect(() => {
		rules = data.rules;
	});

	let groups = $derived([...new Set(data.routes.map(r => r.group))]);

	function handleToggle(role, routeId, checked) {
		if (!rules[role]) rules[role] = {};
		rules[role][routeId] = checked;
	}
</script>

<svelte:head>
	<title>Pengaturan Halaman</title>
</svelte:head>

<div class="p-6">
	<div class="mb-6 flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold mb-2">Pengaturan Akses Halaman</h1>
			<p class="text-base-content/70">Atur hak akses halaman mana saja yang dapat dilihat oleh setiap role.</p>
		</div>
	</div>

	{#if form?.success}
		<div class="alert alert-success mb-6 shadow-sm">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			<span>Pengaturan akses halaman berhasil disimpan.</span>
		</div>
	{/if}

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-0">
			<form method="POST" action="?/save" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}>
				
				<!-- Hidden inputs for form submission -->
				{#each data.roles as role}
					{#each data.routes as route}
						<input type="hidden" name={`access_${role}_${route.id}`} value={rules[role][route.id].toString()} />
					{/each}
				{/each}

				<div class="overflow-x-auto">
					<table class="table table-zebra w-full">
						<thead class="bg-base-200/50">
							<tr>
								<th>Modul / Halaman</th>
								{#each data.roles as role}
									<th class="text-center capitalize">{role}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each groups as group}
								<!-- Group Header -->
								<tr class="bg-base-200/30">
									<td colspan={data.roles.length + 1} class="font-bold text-base-content/60 bg-base-200">
										{group}
									</td>
								</tr>
								
								<!-- Routes in this group -->
								{#each data.routes.filter(r => r.group === group) as route}
									<tr class="hover">
										<td class="pl-8">
											<div class="font-medium">{route.name}</div>
											<div class="text-xs text-base-content/50 opacity-70">{route.id}</div>
										</td>
										{#each data.roles as role}
											<td class="text-center">
												<input 
													type="checkbox" 
													class="toggle toggle-sm toggle-primary" 
													checked={rules[role][route.id]} 
													onchange={(e) => handleToggle(role, route.id, e.currentTarget.checked)}
												/>
											</td>
										{/each}
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>

				<div class="p-6 bg-base-200/30 border-t border-base-200 flex justify-end gap-2">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						Simpan Pengaturan
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
