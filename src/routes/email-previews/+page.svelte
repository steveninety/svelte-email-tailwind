<script lang="ts">
	import type { PageServerData, ActionData } from './$types';
	import EmailPreviews from './EmailPreviews.svelte';

	export let data: PageServerData;
	export let form: ActionData;
</script>

<EmailPreviews {data} {form} unstyled={false} email="name@example.com" />