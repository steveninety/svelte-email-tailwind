<script lang="ts">
	import type {
		StandardLonghandProperties,
		StandardProperties,
		StandardShorthandProperties
	} from 'csstype';
	import { styleToString } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	interface $$Props extends Omit<HTMLAttributes<HTMLImageElement>, 'style'> {
		style?: StandardProperties & StandardLonghandProperties & StandardShorthandProperties;
		alt: string;
		src: string;
		width: string;
		height: string;
	}

	export let style: $$Props['style'] = {};
	export let styleString: string = '';
	let className: string | undefined = undefined;
	export { className as class };
	export let alt = '';
	export let src = '';
	export let width = '0';
	export let height = '0';

	const styleDefault = styleToString({
		display: 'block',
		outline: 'none',
		border: 'none',
		textDecoration: 'none',
		...style
	});
</script>

<img
	{alt}
	{src}
	{width}
	{height}
	class={className}
	style={styleDefault + styleString}
	{...$$restProps}
/>
