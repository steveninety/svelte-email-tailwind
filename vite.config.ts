import { sveltekit } from '@sveltejs/kit/vite';
import icons from 'unplugin-icons/vite';
import kitDocs from '@svelteness/kit-docs/node';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [icons({ compiler: 'svelte' }), kitDocs(), sveltekit()],
  server: { hmr: false }
};

export default config;
