#1.0.0 (2024-03-14)

## Features
- A Vite plugin to transform Tailwind classes on build-time.
- Preview interface component has been added to the package (including corresponding server utility functions).

## BREAKING CHANGES
- The renderTailwind() function is now obsolete and has been removed. Use the Vite plugin instead.
- The renderSvelte() function is replaced by Svelte's native render() function. Use the renderAsPlainText() function to turn a rendered component's html to plain text.
- The `<Custom />` component is required to use Tailwind classes on custom html.
