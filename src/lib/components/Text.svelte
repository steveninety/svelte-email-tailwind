<script lang="ts">
	import type {
		StandardLonghandProperties,
		StandardProperties,
		StandardShorthandProperties
	} from 'csstype';
	import { styleToString } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	interface $$Props extends Omit<HTMLAttributes<HTMLParagraphElement>, 'style'> {
		style?: StandardLonghandProperties & StandardShorthandProperties & StandardProperties;
	}

	export let style: $$Props['style'] = {};
	export let styleString: string = '';
	export let as = 'p';
	let className: string | null | undefined = undefined;
	export { className as class };

	const styleDefault = styleToString({
		fontSize: '14px',
		lineHeight: '24px',
		margin: '16px 0',
		...style
	});
	// console.log(styleDefault);
</script>

<svelte:element this={as} style={styleDefault + styleString} class={className} {...$$restProps}>
	<slot />
</svelte:element>
