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

	const doctype =
		'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
</script>

{@html doctype}
<html style={styleDefault + styleString} {...$$restProps} id="__svelte-email" {lang}>
	<slot />
</html>
