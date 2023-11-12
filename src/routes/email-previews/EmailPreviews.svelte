<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';
	import { persisted } from 'svelte-persisted-store';
	import { get, writable, type Writable } from 'svelte/store';
	import { onMount } from 'svelte';

	export let data: PageServerData;
	export let form: ActionData;
	export let spacingTop: string = '6rem';
	export let spacingBottom: string = '1rem';
	export let unstyled = false;
	export let email: string = 'name@example.com';

	let w: number;
	let h: number;

	let formCreateEmail: HTMLFormElement;
	let formSendEmail: HTMLFormElement;

	const selected = persisted('selected-email', null);

	let selectingComponent = false;
	let invalidEmail = false;
	let sending = false;
	let success: boolean | null;

	let shownInterface: 'styledHtml' | 'plainText' | 'code' = 'styledHtml';
	let interfaceSrc: string | undefined;

	let showSendEmailForm = false;
	let showComponentList = true;

	let note: string;

	let styledHtml: string | undefined;
	const plainText: Writable<string | undefined> = writable();
	$: if (form?.htmlRenderedTailwind) styledHtml = form.htmlRenderedTailwind;
	$: plainText.update((oldValue) => {
		// console.log('old:', oldValue)
		// console.log('new:', form?.plainText)
		if (oldValue?.length && form?.plainText?.length) {
			if (oldValue !== form.plainText) {
				return form.plainText.replace(/\n/g, '<br />');
			} else {
				return oldValue;
			}
		} else {
			return form?.plainText?.replace(/\n/g, '<br />');
		}
	});
	$: if (shownInterface === 'styledHtml') {
		interfaceSrc = styledHtml;
	} else if (shownInterface === 'plainText') {
		interfaceSrc = get(plainText);
	}

	const icons = {
		folder: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M1 2.5h8.48l2 2.5H23v16H1V2.5Zm2 2V19h18V7H10.52l-2-2.5H3Z"/></svg>`,
		file: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3 1h12.414L21 6.586V23H3V1Zm2 2v18h14V9h-6V3H5Zm10 .414V7h3.586L15 3.414Z"/></svg>`,
		chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m17.5 8.086l-5.5 5.5l-5.5-5.5L5.086 9.5L12 16.414L18.914 9.5L17.5 8.086Z"/></svg>`,
		mail: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M1 3h22v18H1V3Zm2 2v1.83l9 4.55l9-4.55V5H3Zm18 4.07l-9 4.55l-9-4.55V19h18V9.07Z"/></svg>`,
		check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M20.985 7.378L10.38 17.985l-6.364-6.364l1.414-1.414l4.95 4.95l9.192-9.193l1.414 1.414Z"/></svg>`,
		error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18ZM1 12C1 5.925 5.925 1 12 1s11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12Zm12-5.5V14h-2V6.5h2Zm-2 9h2.004v2.004H11V15.5Z"/></svg>`
	};

	onMount(() => {
		if (get(selected) && !data?.emailComponentList?.find((file) => file === get(selected))) {
			console.warn(`Svelte component '${get(selected)}' doesn't seem to exist (anymore)...`);
			selected.update(() => null);
		}
		if (get(selected) && formCreateEmail) {
			formCreateEmail.requestSubmit();
		}
	});

	function timer(delay: number = 2000) {
		return new Promise((resolve) => setTimeout(resolve, delay));
	}
</script>

<div
	class="{unstyled
		? 'email-preview-wrapper'
		: ''} wrapper w-full h-full flex mx-auto bg-[inherit] absolute inset-0 z-[9999]"
	style="position: absolute; inset: 0; width: 100%; height: 100%;"
>
	<!-- Fixed background -->
	<div class="fixed inset-0 -z-10 bg-[inherit] pointer-events-none" />
	<div
		class="content w-full h-full flex flex-col gap-20"
		style="width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; gap: 1rem"
	>
		<!-- <div class="w-full flex justify-between items-stretch border-neutral-300"> -->
		<div
			class="w-full grid gap-y-0 border-neutral-300"
			style="display: grid; grid-template-rows: auto; grid-template-columns: repeat(3, minmax(auto,1fr)); padding: {spacingTop} 1rem 0 1rem;"
		>
			<!-- Button toggle file list -->
			<button
				style="display:flex; width: fit-content"
				class="w-fit rounded-full flex items-center gap-10 border-2 border-neutral-300 px-10 py-1 {showComponentList
					? 'text-neutral-100 bg-neutral-700 border-neutral-700'
					: 'border-neutral-300 hover:border-neutral-700'}"
				on:click={() => {
					if (showSendEmailForm && !showComponentList) showSendEmailForm = false;
					showComponentList = !showComponentList;
				}}
			>
				<div class="flex" style="display: flex;">
					<div class="w-20">{@html icons.folder}</div>
					<div class={showComponentList ? 'rotate-180' : 'rotate-0'}>{@html icons.chevron}</div>
				</div>
			</button>
			{#if showComponentList && !showSendEmailForm}
				<form
					method="POST"
					action="?/create-email"
					use:enhance={(e) => {
						selectingComponent = true;
						return async ({ update }) => {
							selectingComponent = false;
							await update();
							for (const el of e.formElement.elements) {
								// @ts-ignore
								if (el.value === get(selected)) el.focus();
							}
						};
					}}
					class="row-start-2 row-end-2 col-span-3 w-fit h-fit max-h-[25vh] overflow-y-scroll flex flex-col mt-10 p-10 border-2 border-neutral-700 sm:flex-row sm:flex-wrap gap-10 {selectingComponent
						? 'pointer-events-none cursor-wait'
						: ''}"
					style="grid-row-start: 2; grid-row-end: 2; grid-column: 1 / 3;"
					bind:this={formCreateEmail}
				>
					{#if !data || !data.emailComponentList}
						<div>.svelte files not found / directory not found</div>
					{:else}
						<fieldset style="width: fit-content">
							{#each data.emailComponentList as emailComponent}
								<div class="w-full">
									<input
										class="absolute opacity-0"
										name="email-component"
										type="radio"
										value={emailComponent}
										id={emailComponent}
										on:change={() => formCreateEmail.requestSubmit()}
										bind:group={$selected}
										checked={emailComponent === get(selected)}
									/>
									<label
										for={emailComponent}
										class:selected={emailComponent === get(selected)}
										class="flex items-center w-full cursor-pointer whitespace-nowrap py-5 px-10 {emailComponent ===
										get(selected)
											? 'bg-neutral-700 text-neutral-100 border-neutral-700'
											: 'border-neutral-300 hover:bg-neutral-300'}"
									>
										<!-- <File
											class="innline mr-5 relative bottom-1"
											style="display:inline; margin-right:5px;"
										/> -->
										<div class="inline mr-5 relative bottom-1" style="display: inline;">
											{@html icons.file}
										</div>
										{emailComponent}
									</label>
								</div>
							{/each}
						</fieldset>
					{/if}
				</form>
			{/if}
			<!-- Buttons interface switch -->
			<div
				style="width: fit-content; margin: 0 auto;"
				class="toggles w-fit mx-auto border-2 {!$selected
					? 'border-neutral-300 [&>*]:cursor-not-allowed'
					: 'border-neutral-700'} flex rounded-full"
			>
				<div
					class="w-80 first-of-type:rounded-tl-full first-of-type:rounded-bl-full last-of-type:rounded-tr-full last-of-type:rounded-br-full overflow-hidden"
				>
					<input
						class="absolute opacity-0"
						type="radio"
						name="shown-interface"
						id="styledHtml"
						disabled={!$selected}
						bind:group={shownInterface}
						on:change={(e) => {
							// @ts-ignore
							shownInterface = e.currentTarget.id;
						}}
						value="styledHtml"
						checked={shownInterface === 'styledHtml'}
					/>
					<label
						for="styledHtml"
						class="block w-full py-1 px-5 text-center cursor-pointer {shownInterface ===
						'styledHtml'
							? 'bg-neutral-700 text-neutral-100 '
							: 'border-trans hover:bg-neutral-300'} {!$selected
							? 'opacity-50 cursor-not-allowed'
							: ''} ">Styled</label
					>
				</div>
				<div
					class="w-80 first-of-type:rounded-tl-full first-of-type:rounded-bl-full last-of-type:rounded-tr-full last-of-type:rounded-br-full overflow-hidden"
				>
					<input
						class="absolute opacity-0"
						type="radio"
						name="shown-interface"
						id="plainText"
						disabled={!$selected}
						bind:group={shownInterface}
						on:change={(e) => {
							// @ts-ignore
							shownInterface = e.currentTarget.id;
						}}
						value="plainText"
						checked={shownInterface === 'plainText'}
					/>
					<label
						for="plainText"
						class="block w-full py-1 px-5 text-center cursor-pointer {shownInterface === 'plainText'
							? 'bg-neutral-700 text-neutral-100 '
							: 'border-trans hover:bg-neutral-300'} {!$selected
							? 'opacity-50 cursor-not-allowed'
							: ''} ">Text</label
					>
				</div>
			</div>
			<!-- Button toggle email form -->
			<button
				disabled={!$selected}
				style="margin-left: auto; margin-right: 0;"
				class="ml-auto w-fit rounded-full border-2 py-1 px-10 flex {!$selected
					? 'opacity-50 cursor-not-allowed'
					: ''} {showSendEmailForm
					? 'text-neutral-100 bg-neutral-700 border-neutral-700'
					: 'border-neutral-300 hover:border-neutral-700'}"
				on:click={() => {
					if (showComponentList && !showSendEmailForm) showComponentList = false;
					showSendEmailForm = !showSendEmailForm;
				}}
			>
				<div class="flex items-center" style="display: flex;">
					<div class="">{@html icons.mail}</div>
					<div class={showSendEmailForm ? 'rotate-180' : 'rotate-0'}>{@html icons.chevron}</div>
				</div>
			</button>
			{#if showSendEmailForm && !showComponentList}
				<form
					method="POST"
					use:enhance={() => {
						sending = true;
						return async ({ result }) => {
							sending = false;
							/**
							 * Do NOT call `update` here, because it overrides the old form data (ActionData).
							 * The other form is important for state management - this form is not.
							 */
							// update({ reset: false, invalidateAll: false });
							await timer(5);
							//@ts-ignore
							if (result.data.success === true) {
								success = true;
								//@ts-ignore
							} else if (result.data.success === false) {
								success = false;
							}
							await timer(1500);
							success = null;
						};
					}}
					action="?/send-email"
					bind:this={formSendEmail}
					class="row-start-3 row-end-3 col-span-3 w-fit ml-auto p-10 border-2 border-neutral-700 flex md:flex-row flex-col md:items-end justify-end mt-10 gap-x-10 gap-y-20"
					style="grid-row-start: 3; grid-row-end: 3; 	grid-column: span 3 / span 3; margin-left: auto; border: 1px solid; display: flex; flex-direction: column; padding: 0.5rem; gap: 0.5rem"
				>
					<div
						class="w-fit flex flex-col md:flex-row gap-x-10 gap-y-20"
						style="display: flex; flex-direction: column; gap: 0.5rem"
					>
						<div
							class=" flex flex-col flex-1 gap-5 pointer-events-none"
							style="display: flex; flex-direction: column;"
						>
							<label for="component" class="text-sm">Component</label>
							<input
								type="text"
								name="component"
								id="component"
								bind:value={$selected}
								readonly
								class="w-full p-5 border-2 border-neutral-300 bg-neutral-300"
							/>
						</div>
						<div class=" flex flex-col flex-1 gap-5" style="display: flex; flex-direction: column;">
							<label for="note" class="text-sm">Note</label>
							<input
								type="text"
								name="note"
								id="note"
								bind:value={note}
								placeholder="Add a note..."
								class="p-5 border-2 border-neutral-300 bg-trans"
							/>
						</div>
						<div class="flex flex-col flex-1 gap-5" style="display: flex; flex-direction: column;">
							<label for="to" class="text-sm">To</label>
							{#if invalidEmail}
								<div>This field is required.</div>
							{/if}
							<input
								type="email"
								name="to"
								id="to"
								required
								bind:value={email}
								placeholder="name@example.com"
								class="w-full p-5 border-2 focus:border-yellow invalid:border-red border-neutral-300 bg-trans"
							/>
						</div>
					</div>
					<input hidden name="html" type="text" bind:value={interfaceSrc} />
					<button
						type="submit"
						class="py-5 px-20 rounded-full border-2 h-fit bg-neutral-700 border-neutral-700 text-neutral-100 hover:text-neutral-700 hover:bg-neutral-100 {sending
							? 'pointer-events-none cursor-wait opacity-50'
							: ''} {success ? 'pointer-events-none' : ''}"
					>
						<div class="relative">
							<div class:opacity-0={sending || success === true || success === false}>Send</div>
							{#if sending}
								<div class="absolute inset-0">...</div>
							{/if}
							{#if success === true}
								<div class="absolute left-1/2 top-1/2 w-fit -translate-x-1/2 -translate-y-1/2">
									{@html icons.check}
								</div>
							{:else if success === false}
								<div class="absolute left-1/2 top-1/2 w-fit -translate-x-1/2 -translate-y-1/2">
									{@html icons.error}
								</div>
							{/if}
						</div>
					</button>
				</form>
			{/if}
		</div>
		<!-- Main interface -->
		<div
			style="max-width: 100%; position: relative; height: 100%; max-height: 100%; padding: 0rem 1rem {spacingBottom} 1rem;"
			class="min-w-[283px] max-w-full min-h-[103px] resize z-[1] flex max-h-full h-full relative bg-neutral-100"
			bind:clientWidth={w}
			bind:clientHeight={h}
		>
			<div
				style="max-width: 100%; position: relative; width: 100%; height: 100%; max-height: 100%; max-width: 100%; display: flex"
				class="relative w-full h-full border-2 {showSendEmailForm || showComponentList
					? 'border-neutral-300'
					: 'border-neutral-700'}"
			>
				{#if !$selected && !selectingComponent}
					<div
						class="m-auto text-center"
						style="position: absolute; inset: 0; width: fit-content; height: fit-content; margin: auto; z-index: 10000"
					>
						Select an email
					</div>
				{/if}
				{#if $selected}
					<div
						style="position: absolute; top: 0.5rem; right: 1rem; z-index: 10000"
						class=" text-[1.4rem] text-[black] bg-none absolute z-10 right-10 top-5 mix-blend-difference invert;"
					>
						{w}px × {h}px
					</div>
				{/if}
				<iframe
					srcdoc={interfaceSrc !== '' ? interfaceSrc : 'Nothing to show...'}
					title="styled-email-preview"
					class="w-full"
					style="width: 100%; height: 100%; {unstyled ? 'border: 2px solid;' : ''}"
					width="100%"
					height="100%"
				/>
			</div>
		</div>
	</div>
</div>

<style>
	:focus-visible,
	input[type='radio']:focus-visible + label {
		outline: 2px auto Highlight;
		outline: 2px auto -webkit-focus-ring-color;
	}
	input[type='radio']:checked + label {
		outline: 2px auto Highlight;
		outline: 2px auto -webkit-focus-ring-color;
	}
	.email-preview-wrapper * {
		all: initial;
		background-color: white;
		z-index: 9999;
	}
</style>
