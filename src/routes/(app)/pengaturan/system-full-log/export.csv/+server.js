import { db } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

const csvEscape = (v) => {
	const s = String(v ?? '');
	if (s.includes('"') || s.includes(',') || s.includes('\n')) {
		return `"${s.replace(/\"/g, '""')}"`;
	}
	return s;
};

export const GET = async ({ locals, url }) => {
	if (locals.user?.role !== 'admin') {
		return new Response('Forbidden', { status: 403 });
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
		.limit(5000);

	const header = ['waktu', 'user', 'role', 'aksi', 'modul', 'keterangan', 'ip'];
	const rows = logs.map((l) => [
		l.createdAt,
		l.username || '',
		l.role || '',
		l.aksi,
		l.modul,
		l.keterangan || '',
		l.ip || ''
	]);

	const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="system-full-log.csv"'
		}
	});
};
