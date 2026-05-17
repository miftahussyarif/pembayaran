import { json } from '@sveltejs/kit';
import { generatePublicDatabase } from '$lib/server/publicBackup.js';

export async function GET() {
	try {
		const result = await generatePublicDatabase();
		return json(result);
	} catch (error) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
