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
		width: '100%',
		...style
	});
</script>

<table
	style={styleDefault + styleString}
	align="center"
	width="100%"
	border={0}
	cellPadding={0}
	cellSpacing={0}
	role="presentation"
	{...$$restProps}
	class={className}
>
	<tbody style="width: 100%;">
		<tr style="width: 100%;">
			<slot />
		</tr>
	</tbody>
</table>
