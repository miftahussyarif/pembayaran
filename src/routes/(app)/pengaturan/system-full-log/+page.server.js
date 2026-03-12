import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

export const load = async ({ locals, url }) => {
	if (locals.user?.role !== 'admin') {
		throw redirect(303, '/');
	}

	const start = url.searchParams.get('start') || '';
	const end = url.searchParams.get('end') || '';
	const userId = url.searchParams.get('userId') || '';

	const conditions = [];
	if (start) conditions.push(gte(schema.systemLogs.createdAt, `${start}T00:00:00.000Z`));
	if (end) conditions.push(lte(schema.systemLogs.createdAt, `${end}T23:59:59.999Z`));
	if (userId) conditions.push(eq(schema.systemLogs.userId, Number(userId)));

	let logsQuery = db
		.select()
		.from(schema.systemLogs);
	if (conditions.length) {
		logsQuery = logsQuery.where(and(...conditions));
	}
	const logs = await logsQuery
		.orderBy(desc(schema.systemLogs.id))
		.limit(300);

	const users = await db.select({
		id: schema.users.id,
		namaLengkap: schema.users.namaLengkap,
		username: schema.users.username,
		role: schema.users.role
	}).from(schema.users);

	return { logs, users, filters: { start, end, userId } };
};
