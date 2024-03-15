<script lang="ts">
	import type {
		StandardLonghandProperties,
		StandardProperties,
		StandardShorthandProperties
	} from 'csstype';
	import { styleToString } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	interface $$Props extends Omit<HTMLAttributes<HTMLBodyElement>, 'style'> {
		style?: StandardLonghandProperties & StandardShorthandProperties & StandardProperties;
	}

	export let style = {};
	export let styleString: string = '';
	let className: string | undefined = undefined;
	export { className as class };
	const styleDefault = styleToString({ ...style });
</script>

<body {...$$restProps} style={styleDefault + styleString} class={className}>
	<slot />
</body>
