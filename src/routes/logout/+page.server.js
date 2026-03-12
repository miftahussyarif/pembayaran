import { redirect } from '@sveltejs/kit';

export const actions = {
	default: ({ cookies }) => {
		cookies.delete('sessionid', { path: '/' });
		throw redirect(303, '/login');
	}
};
