<script>
	import { Button, Hr, Html, Text, Head } from '$lib';

	export let name = 'World';
</script>

<Html lang="en">
	<Head>
		<meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
	</Head>
	<Text>
		Hello, {name}!
	</Text>
	<Hr />
	<Button href="https://svelte.dev">Visit Svelte</Button>
</Html>
