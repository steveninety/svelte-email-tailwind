import type { TailwindConfig } from 'tw-to-css';
import { inlineTailwind } from './utils/inline-tailwind.js';

export default function svelteEmailTailwind({
	tailwindConfig,
	pathToEmailFolder = '/src/lib/emails'
}: {
	tailwindConfig?: TailwindConfig;
	pathToEmailFolder?: string;
}) {
	return {
		name: 'vite:inline-tw',
		async transform(src: string, id: string) {
			if (id.includes(pathToEmailFolder) && id.includes('.svelte')) {
				return { code: inlineTailwind(src, id, tailwindConfig) };
			}
		}
	};
}
