<script lang="ts">
	import type {
		StandardLonghandProperties,
		StandardProperties,
		StandardShorthandProperties
	} from 'csstype';
	import { styleToString } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	interface $$Props extends Omit<HTMLAttributes<HTMLAnchorElement>, 'style'> {
		style?: StandardLonghandProperties & StandardShorthandProperties & StandardProperties;
		target?: string;
		href: string;
	}

	export let style: $$Props['style'] = {};
	export let styleString: string = '';
	let className: string | null | undefined = undefined;
	export { className as class };
	export let target = '_blank';
	export let href = '';

	const styleDefault = styleToString({
		color: '#067df7',
		textDecoration: 'none',
		...style
	});
</script>

<a {...$$restProps} {href} {target} style={styleDefault + styleString} class={className}>
	<slot />
</a>
