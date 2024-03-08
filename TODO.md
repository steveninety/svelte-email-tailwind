# Create emails on build time - only replace prop slots for props

/* 
 * PART 1 (X): write script to transform tailwind classes to inline styles inside the compiled js ssr component file.
*/

/* 
 * PART 2 (X): Create a Vite plugin that executes PART 1 in BOTH dev AND on build-time, for every .svelte email component. 
 * - Config: In the source code, replace all import aliases ('$lib') for their original path
 - Config: Define your TW Config
 - Config: Define your email folder (instead of .email.svelte id)
*/

/* 
 * PART 3 ( ): Release the package (update)
 * 1. Export the Vite plugin
 * 1. Write documentation 
 * 2. Update NPM package
*/
