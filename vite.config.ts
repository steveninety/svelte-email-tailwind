import { sveltekit } from '@sveltejs/kit/vite';
import Inspect from 'vite-plugin-inspect'
import type { UserConfig } from 'vite';
import type { TailwindConfig } from 'tw-to-css';
import svelteEmailTailwind from './src/lib/vite';

const emailTwConfig: TailwindConfig = {
  theme: {
    screens: {
      md: { max: '767px' },
      sm: { max: '475px' }
    },
    extend: {
      colors: {
        brand: 'rgb(255, 62, 0)'
      }
    }
  }
}

const config: UserConfig = {
  plugins: [
    sveltekit(),
    Inspect(),
    svelteEmailTailwind({
      tailwindConfig: emailTwConfig,
      pathToEmailFolder: '/src/emails'
    })
  ],
  // server: { hmr: false }
};

export default config;
