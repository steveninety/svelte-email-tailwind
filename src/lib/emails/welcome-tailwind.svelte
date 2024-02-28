<script lang="ts">
	import { Body, Button, Container, Head, Hr, Html, Img, Preview, Section, Text } from '$lib';

	export let name = {
		firstName: {
			value: ''
		}
	};
	const fontFamily = {
		fontFamily:
			'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
	};
</script>

<Html lang="en" class="bg-white">
	<Head>
		<meta name="viewport" content="width=device-width, initial-scale=1" />

		<style>
			@media (max-width: 767px) {
				.md_text_white {
					color: white;
				}
			}
		</style>
	</Head>
	<Preview preview="Welcome to svelte-email" />
	<Body>
		<Container class="my-0 mx-auto text-black">
			<Section>
				<Img
					src="https://svelte.dev/svelte-logo-horizontal.svg"
					alt="Svelte logo"
					class="my-0 mr-auto"
					width="200"
					height="50"
				/>
				<Text class="text-[16px] leading-[26px] text-inherit">
					<!-- <div data-prop={`["purchased_products"]["0"]`}> -->
					<!-- 	{#each purchased_products as value} -->
					<!-- 		<span>{value.field1}</span> -->
					<!-- 		{#if value.field2.length} -->
					<!-- 			<div data-prop={`["purchased_products"]["0"]["field2"]`}> -->
					<!-- 				{#each value.field2 as field2} -->
					<!-- 					<span>{field2}</span> -->
					<!-- 				{/each} -->
					<!-- 			</div> -->
					<!-- 		{:else} -->
					<!-- 			<span>{value.field2}</span> -->
					<!-- 		{/if} -->
					<!-- 	{/each} -->
					<!-- </div> -->
					<!-- {purchased_products[0]} -->
					<!-- {name.firstName.value} -->
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
