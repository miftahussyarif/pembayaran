import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		plugins: [tailwindcss(), sveltekit()],
		preview: {
			allowedHosts: env.PUBLIC_DOMAIN ? [env.PUBLIC_DOMAIN] : []
		}
	};
});
