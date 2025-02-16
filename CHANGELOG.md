# 2.1.0 (2025-16-02)

## Minor Issues

-  chore: made function param of `svelteEmailTailwind` optional, since all keys of the object param are optional too ([[#16](https://github.com/steveninety/svelte-email-tailwind/issues/16)]).
-fix: Removed 'pretty' dependency because it's no longer used in the render function since moving to Svelte's native `render`.
- chore: deleted the html-to-text patch - no longer an issue in later version of Vite + documented the `renderAsPlainText` function ([#19](https://github.com/steveninety/svelte-email-tailwind/issues/19))
- fix: renamed `Preview` to `PreviewInterface` in `/preview/PreviewInterface.svelte`, to distinguish the interface component from the email component that is also called 'Preview' ([#20](https://github.com/steveninety/svelte-email-tailwind/issues/20))
- chore: updated the @sveltejs/package devDependency to V2 and adjusted the package.json accordingly. This should also fix some type issues around imports. ([#20](https://github.com/steveninety/svelte-email-tailwind/issues/20))

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
