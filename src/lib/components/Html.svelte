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

	export let lang = 'en';
	export let styleString = '';
	export let style: $$Props['style'] = {};

const styleDefault = styleToString({
		...style
	});

</script>

<html style={styleDefault + styleString} {...$$restProps} id="__svelte-email" {lang}>
	<slot />
</html>
