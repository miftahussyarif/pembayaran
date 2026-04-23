import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getSessionCookieName } from '$lib/server/auth.js';

export const actions = {
	default: async ({ cookies, locals }) => {
		if (locals.user?.id) {
			await db.update(schema.users).set({ sessionId: null }).where(eq(schema.users.id, locals.user.id));
		}

		cookies.delete(getSessionCookieName(), { path: '/' });
		throw redirect(303, '/login');
	}
};
