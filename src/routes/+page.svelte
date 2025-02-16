<script lang="ts">
	import type { PreviewData } from '$lib/preview';
	import PreviewInterface from '$lib/preview/PreviewInterface.svelte';

	export let data: PreviewData;
</script>

<PreviewInterface {data} email="name@example.com" />
