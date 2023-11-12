<script lang="ts">
	import type {
		StandardLonghandProperties,
		StandardProperties,
		StandardShorthandProperties
	} from 'csstype';
	import { styleToString } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	interface $$Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
		style?: StandardLonghandProperties & StandardProperties & StandardShorthandProperties;
	}

	export let style: $$Props['style'] = {};
	let className: string | undefined = undefined;
	export { className as class };

	const styles = { maxWidth: '37.5em', ...style };
	const inlineStyle = styleToString(styles);
</script>


<table
	align="center"
	width="100%"
	role="presentation"
	cellSpacing="0"
	cellPadding="0"
	border={0}
	{...$$restProps} 
	style={inlineStyle} 
	class={className}
>
	<tbody>
		<tr style="width: 100%;">
			<td>
				<slot />
			</td>
		</tr>
	</tbody>
</table>
