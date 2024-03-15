<script lang="ts">
	import type { PreviewData } from '$lib/preview';
	import Preview from '$lib/preview/preview.svelte';

	export let data: PreviewData;
</script>

<Preview {data} email="name@example.com" />
