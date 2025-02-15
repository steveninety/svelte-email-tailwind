import type { TailwindConfig } from 'tw-to-css';
import { inlineTailwind } from './utils/inline-tailwind.js';

interface Options {
	tailwindConfig?: TailwindConfig;
	pathToEmailFolder?: string;
}

export default function svelteEmailTailwind(options: Options = {}) {
	return {
		name: 'vite:inline-tw',
		async transform(src: string, id: string) {
			if (id.includes(options.pathToEmailFolder ?? '/src/lib/emails') && id.includes('.svelte')) {
				return { code: inlineTailwind(src, id, options.tailwindConfig) };
			}
		}
	};
}
