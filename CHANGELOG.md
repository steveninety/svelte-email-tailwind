# 2.1.0 (2025-15-02)

## Minor Issues

- Made function param of `svelteEmailTailwind` optional, since all keys of the object param are optional too.
- Removed 'pretty' dependency because it's no longer used in the render function since moving to Svelte's native `render`.
- Moved back to the original html-to-text dependency instead of the forked package @steveninety/html-to-text. The patch of a Vite/import-related issue, which was the original reason for forking this package, seems to no longer be an issue in a later version of Vite.
- Documented the `renderAsPlainText` function.
- Renamed `Preview` to `PreviewInterface` in `/preview/PreviewInterface.svelte`, to distinguish the interface component from the email component that is also called 'Preview'. Decided (1) to not put it in the main entry point to keep it separate from email components and (2) to not give this version a major version bump because the PreviewInterface is not a production component - it's just used in development. 
- Updated the @sveltejs/package devDependency to V2 and adjusted the package.json accordingly. This should fix some type issues around imports.

# 2.0.1 (2024-11-10)

## Patch

Move svelte-persisted-store from dev dep to regular dep

# 2.0.0 (2024-11-10)

## BREAKING CHANGES

Svelte 5 compatibility.

# 1.1.0 (2024-11-10)

## Patch

Update to the latest Svelte 4 version

# 1.0.2 (2024-03-30)

## Patch

Move Resend from dev dep to normal dep

# 1.0.1 (2024-03-14)

## Patch

Move tw-to-css from dev dep to normal dep

# 1.0.0 (2024-03-14)

## Features

- A Vite plugin to transform Tailwind classes on build-time.
- Preview UI component has been added to the package (including corresponding server utility functions).

## BREAKING CHANGES

- The renderTailwind() function is now obsolete and has been removed. Use the Vite plugin instead.
- The renderSvelte() function is replaced by Svelte's native render() function. Use the renderAsPlainText() function to turn a rendered component's html to plain text.
- The `<Custom />` component is required to use Tailwind classes on custom html.
