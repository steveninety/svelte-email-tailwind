<script lang="ts">
	import {
		Body,
		Button,
		Container,
		Head,
		Hr,
		Html,
		Img,
		Preview,
		Section,
		Text,
		Custom
	} from '$lib';

	export let name = {
		firstName: {
			value: ''
		}
	};
	const fontFamily = {
		fontFamily:
			'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
	};
	const textBlue = {
		color: 'blue'
	};
	const purchased_products = ['hello', [{ field1: 33, field2: 44 }]];
</script>

<Html lang="en" class="bg-white">
	<Head class="he">
		<meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
	</Head>
	<Preview preview="Welcome to svelte-email" />
	<Body style={fontFamily}>
		<Container class="my-0 mx-auto text-black">
			<Section>
				<Img
					src="https://svelte.dev/svelte-logo-horizontal.svg"
					alt="Svelte logo"
					class="my-0 mr-auto"
					width="200"
					height="50"
				/>
				<Custom as="sup" class={['class1', fontFamily]}>2.5</Custom>
				<Text
					style={{ ...fontFamily, color: textBlue.color }}
					styleString="text-transform: uppercase"
					class="text-[16px] leading-[26px] text-inherit"
				>
					{#each purchased_products as value}
						{#if value.length}
							{#each value as field}
								<Text as="span" class="text-[16px]">{field}</Text>
							{/each}
						{:else}
							<Text as="span">{value}</Text>
						{/if}
					{/each}
					{purchased_products[0]}
					{name.firstName.value}
					welcome to svelte-email
				</Text>
			</Section>
			<Section>
				<Text class="text-[16px] leading-[26px]">
					A Svelte component library for building responsive emails
				</Text>
				<Button
					class="bg-brand sm:bg-black rounded-[4px] p-5 md:text-white border-2 text-[16px] text-decoration-none text-center block"
					href="https://github.com/carstenlebek/svelte-email"
				>
					View on GitHub
				</Button>
				<Text class="text-[16px] leading-[26px]">Happy coding!</Text>
			</Section>
			<Section>
				<Hr class="border border-[#8898aa] my-[20px] mx-0" />
				<Text class="text-[12px] text-[#8898aa]">Carsten Lebek</Text>
			</Section>
		</Container>
	</Body>
</Html>
