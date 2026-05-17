import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const load = async ({ parent }) => {
	const parentData = await parent();

	// Try to load public tanggungan data to check if it exists
	let dataExists = false;
	let lastUpdated = null;

	try {
		const filePath = path.join('static', 'public-data', 'tanggungan.json');
		const raw = await readFile(filePath, 'utf-8');
		const parsed = JSON.parse(raw);
		dataExists = true;
		lastUpdated = parsed.generatedAt || null;
	} catch {
		dataExists = false;
	}

	return {
		...parentData,
		dataExists,
		lastUpdated
	};
};
