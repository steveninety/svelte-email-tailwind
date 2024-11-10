<script lang="ts">
	import type {
		StandardLonghandProperties,
		StandardProperties,
		StandardShorthandProperties
	} from 'csstype';
	import { styleToString } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	interface $$Props extends Omit<HTMLAttributes<HTMLHRElement>, 'style'> {
		style?: StandardLonghandProperties & StandardProperties & StandardShorthandProperties;
	}

	export let style: $$Props['style'] = {};
	export let styleString: string = '';
	let className: string | null | undefined = undefined;
	export { className as class };

	const styleDefault = styleToString({
		width: '100%',
		border: 'none',
		borderTop: '1px solid #eaeaea',
		...style
	});
</script>

<hr style={styleDefault + styleString} {...$$restProps} class={className} />
