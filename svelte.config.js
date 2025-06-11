import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  extensions: ['.svelte', '.md'],
  kit: {
    adapter: adapter(),
    // alias: {
    //   $lib: "src/lib"
    // }
  },
  // exclude: '*.js'
};

export default config;
