#1.0.2 (2024-03-30)

## Patch

Move Resend from dev dep to normal dep

#1.0.1 (2024-03-14)

## Patch

Move tw-to-css from dev dep to normal dep

#1.0.0 (2024-03-14)

## Features
- A Vite plugin to transform Tailwind classes on build-time.
- Preview UI component has been added to the package (including corresponding server utility functions).

## BREAKING CHANGES
- The renderTailwind() function is now obsolete and has been removed. Use the Vite plugin instead.
- The renderSvelte() function is replaced by Svelte's native render() function. Use the renderAsPlainText() function to turn a rendered component's html to plain text.
- The `<Custom />` component is required to use Tailwind classes on custom html.
