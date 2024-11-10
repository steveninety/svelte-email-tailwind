<script lang="ts">
	import type {
		StandardLonghandProperties,
		StandardProperties,
		StandardShorthandProperties
	} from 'csstype';
	import { styleToString } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	interface $$Props extends Omit<HTMLAttributes<HTMLTableCellElement>, 'style'> {
		style?: StandardLonghandProperties & StandardProperties & StandardShorthandProperties;
	}

	export let style: $$Props['style'] = {};
	export let styleString: string = '';
	let className: string | null | undefined = undefined;
	export { className as class };

	const styleDefault = styleToString({
		...style
	});
</script>

<td style={styleDefault + styleString} {...$$restProps} class={className}>
	<slot />
</td>
