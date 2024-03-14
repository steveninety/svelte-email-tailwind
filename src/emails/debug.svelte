<script lang="ts">
	import { Html, Head, Preview, Body, Container, Section, Column, Img } from '$lib';

	const baseUrl = '';
</script>

<Html>
	<Head />
	<Body>
		<Img
			src={`${baseUrl}/apple-wallet.png`}
			class="text-[14px]"
			width="28"
			height="28"
			alt="Apple Wallet"
			style={{ display: 'inherit' }}
		/>
	</Body>
</Html>
