<script>
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let editUser = $state(null);
	let passwordUser = $state(null);
	let hapusUser = $state(null); // user yang akan dihapus

	function doHapus() {
		if (!hapusUser) return;
		document.getElementById('form_hapus_user').submit();
	}
</script>

<svelte:head>
	<title>Manajemen User - Aplikasi Pesantren</title>
</svelte:head>

<div class="card bg-base-100 shadow-xl border border-base-200 mb-8">
	<div class="card-body">
		<div class="flex justify-between items-center mb-4">
			<h2 class="card-title text-2xl font-bold">Daftar Pengguna</h2>
			<button class="btn btn-primary btn-sm" onclick={() => modal_add_user.showModal()}>
				+ Tambah User
			</button>
		</div>

		{#if form?.message}
			<div class="alert {form.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 py-2 text-sm rounded-lg">
				<span>{form.message}</span>
			</div>
		{/if}

		<div class="overflow-x-auto">
			<table class="table table-zebra w-full">
				<thead class="bg-base-200">
					<tr>
						<th>Username</th>
						<th>Nama Lengkap</th>
						<th>Role</th>
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as u}
						<tr>
							<td class="font-medium">{u.username}</td>
							<td>{u.namaLengkap}</td>
							<td>
								<span class="badge badge-sm badge-outline uppercase text-[10px] {u.role === 'admin' ? 'badge-primary' : (u.role === 'bendahara' ? 'badge-info' : 'badge-warning')}">
									{u.role}
								</span>
							</td>
							<td class="text-right">
								<div class="flex gap-1 justify-end flex-wrap">
									<button class="btn btn-xs btn-outline btn-primary" onclick={() => { editUser = {...u}; modal_edit_user.showModal(); }}>
										Edit
									</button>
									<button class="btn btn-xs btn-outline btn-warning" onclick={() => { passwordUser = {...u}; modal_reset_pw.showModal(); }}>
										Reset PW
									</button>
									{#if u.username !== 'admin'}
										<button class="btn btn-xs btn-ghost text-error" onclick={() => { hapusUser = {...u}; modal_konfirmasi_hapus.showModal(); }}>
											Hapus
										</button>
									{:else}
										<span class="text-xs text-base-content/40 italic px-2">Superadmin</span>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Form Hapus (tersembunyi) - submit via JS -->
<form id="form_hapus_user" method="POST" action="?/deleteUser" use:enhance>
	<input type="hidden" name="id" value={hapusUser?.id} />
</form>

<!-- Modal Konfirmasi Hapus -->
<dialog id="modal_konfirmasi_hapus" class="modal">
	<div class="modal-box max-w-sm">
		<h3 class="font-bold text-lg text-error mb-2">Konfirmasi Hapus</h3>
		{#if hapusUser}
		<p class="text-sm mb-1">Yakin ingin menghapus user ini secara permanen?</p>
		<div class="bg-base-200 rounded-lg p-3 my-3 text-sm">
			<div><span class="font-bold">Nama:</span> {hapusUser.namaLengkap}</div>
			<div><span class="font-bold">Username:</span> {hapusUser.username}</div>
		</div>
		<p class="text-xs text-error mb-4">⚠️ Tindakan ini tidak dapat dibatalkan.</p>
		{/if}
		<div class="modal-action justify-between">
			<button class="btn" onclick={() => { modal_konfirmasi_hapus.close(); hapusUser = null; }}>Batal</button>
			<button class="btn btn-error" onclick={() => { modal_konfirmasi_hapus.close(); doHapus(); }}>
				Ya, Hapus
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Modal Tambah User -->
<dialog id="modal_add_user" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Tambah Pengguna Baru</h3>
		<form method="POST" action="?/createUser" use:enhance>
			<div class="form-control w-full mb-3">
				<label class="label" for="namaLengkapNew"><span class="label-text">Nama Lengkap</span></label>
				<input type="text" id="namaLengkapNew" name="namaLengkap" placeholder="Nama..." class="input input-sm input-bordered w-full" required />
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="usernameNew"><span class="label-text">Username</span></label>
				<input type="text" id="usernameNew" name="username" placeholder="username" class="input input-sm input-bordered w-full" required />
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="passwordNew"><span class="label-text">Password</span></label>
				<input type="password" id="passwordNew" name="password" placeholder="***" class="input input-sm input-bordered w-full" minlength="4" required />
			</div>
			<div class="form-control w-full mb-6">
				<label class="label" for="roleNew"><span class="label-text">Role Akses</span></label>
				<select id="roleNew" name="role" class="select select-sm select-bordered w-full" required>
					<option value="bendahara">Bendahara</option>
					<option value="petugas">Petugas</option>
					<option value="admin">Admin System</option>
				</select>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modal_add_user.close()}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan User</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Modal Edit User -->
<dialog id="modal_edit_user" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Edit Data User</h3>
		{#if editUser}
		<form method="POST" action="?/updateUser" use:enhance={() => {
			return async ({ update }) => { await update(); modal_edit_user.close(); editUser = null; };
		}}>
			<input type="hidden" name="id" value={editUser.id} />
			<div class="form-control w-full mb-3">
				<label class="label" for="usernameEdit"><span class="label-text text-base-content/60">Username (tidak dapat diubah)</span></label>
				<input type="text" id="usernameEdit" value={editUser.username} class="input input-sm input-bordered w-full bg-base-200" disabled />
			</div>
			<div class="form-control w-full mb-3">
				<label class="label" for="namaLengkapEdit"><span class="label-text">Nama Lengkap</span></label>
				<input type="text" id="namaLengkapEdit" name="namaLengkap" value={editUser.namaLengkap} class="input input-sm input-bordered w-full" required />
			</div>
			<div class="form-control w-full mb-6">
				<label class="label" for="roleEdit"><span class="label-text">Role Akses</span></label>
				<select id="roleEdit" name="role" class="select select-sm select-bordered w-full" required>
					<option value="bendahara" selected={editUser.role === 'bendahara'}>Bendahara</option>
					<option value="petugas" selected={editUser.role === 'petugas'}>Petugas</option>
					<option value="admin" selected={editUser.role === 'admin'}>Admin System</option>
				</select>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => { modal_edit_user.close(); editUser = null; }}>Batal</button>
				<button type="submit" class="btn btn-primary">Simpan Perubahan</button>
			</div>
		</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Modal Reset Password -->
<dialog id="modal_reset_pw" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-1">Reset Password</h3>
		{#if passwordUser}
		<p class="text-sm text-base-content/60 mb-4">Mengubah password untuk: <strong>{passwordUser.namaLengkap}</strong> ({passwordUser.username})</p>
		<form method="POST" action="?/resetPassword" use:enhance={() => {
			return async ({ update }) => { await update(); modal_reset_pw.close(); passwordUser = null; };
		}}>
			<input type="hidden" name="id" value={passwordUser.id} />
			<div class="form-control w-full mb-6">
				<label class="label" for="newPassword"><span class="label-text">Password Baru</span></label>
				<input type="password" id="newPassword" name="newPassword" placeholder="Minimal 4 karakter" class="input input-bordered w-full" minlength="4" required />
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => { modal_reset_pw.close(); passwordUser = null; }}>Batal</button>
				<button type="submit" class="btn btn-warning">Reset Password</button>
			</div>
		</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
