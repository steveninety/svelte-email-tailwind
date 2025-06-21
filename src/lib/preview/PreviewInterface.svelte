<script lang="ts">
	import { enhance } from '$app/forms';
	import { persisted } from 'svelte-persisted-store';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import type { PreviewData } from './index';

	// PROPS
	export let data: PreviewData;
	export let email: string;
	export let spacingTop: string = '1rem';
	export let spacingBottom: string = '1rem';
	export let wrapperStyle: string = '';

	// ELEMENT BINDINGS
	let w: number;
	let h: number;

	let form1: HTMLFormElement;
	let form2: HTMLFormElement;

	// STATES
	const fileSelected = persisted<string | null>('selected-email', null);
	let loadingFile = false;
	let invalidEmail = false;
	let sending = false;
	let success: boolean | null;
	let message: string | null;

	// UI BINDINGS
	let uiActive: 'html' | 'text' | 'code' = 'html';
	let uiSource: string | null | undefined;

	let form2Expanded = false;
	let form1Expanded = true;

	let note: string;

	let html: string | null | undefined;
	let text: string | null | undefined;
	let code: string | null | undefined;

	/**
	 * Display the corresponding data when a ui is selected
	 * Default/auto-switch back to 'html'
	 */
	$: if (uiActive === 'html') {
		uiSource = html;
	} else if (uiActive === 'text') {
		uiSource = text;
	} else if (uiActive === 'code') {
		if (!code) {
			uiActive = 'html';
			uiSource = html;
		} else {
			uiSource = code;
		}
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
		if (get(fileSelected) && !data?.files?.find((file) => file === get(fileSelected))) {
			console.warn(`Svelte component '${get(fileSelected)}' doesn't seem to exist (anymore)...`);
			fileSelected.update((value) => (value = null));
		}
		if (get(fileSelected) && form1) {
			form1.requestSubmit();
		}
	});

	function timer(delay: number = 2000) {
		return new Promise((resolve) => setTimeout(resolve, delay));
	}
</script>

<div id="window" style={wrapperStyle}>
	<div id="content">
		<div id="navigation" style="padding-top: {spacingTop};">
			<button
				id="files-toggle"
				class:show={form1Expanded}
				class="drop-down files-toggle"
				on:click={() => {
					// close the other drop-down
					if (form2Expanded && !form1Expanded) form2Expanded = false;
					form1Expanded = !form1Expanded;
				}}
			>
				<div>
					{@html icons.folder}
					<div class:rotate={form1Expanded} class="chevron">
						{@html icons.chevron}
					</div>
				</div>
			</button>
			{#if form1Expanded && !form2Expanded}
				<form
					method="POST"
					action="?/create-email"
					use:enhance={(e) => {
						loadingFile = true;
						return async ({ result }) => {
							loadingFile = false;

							if (result.type !== 'success') return;
							/**
							 * IMPORTANT! results are updated here - not in the form (ActionData) variable
							 * So always get values through these variables, not through properties on the form variable
							 */
							html = typeof result.data?.html === 'string' ? result.data.html : null;
							text =
								typeof result.data?.text === 'string'
									? result.data.text.replace(/\n/g, '<br />')
									: null;
							code = typeof result.data?.code === 'string' ? result.data.code : null;

							// Highlight currently selected file name
							for (const el of e.formElement.elements) {
								// @ts-ignore
								if (el.value === get(fileSelected)) {
									// @ts-ignore
									el.focus();
								}
							}
						};
					}}
					id="files-form"
					class:disabled={loadingFile}
					bind:this={form1}
					data-lenis-prevent
				>
					{#if !data || !data.files}
						<div>.svelte files not found / directory not found</div>
					{:else}
						<fieldset style="width: fit-content">
							{#each data.files as file}
								<div class="input-wrapper">
									<input
										name="file"
										type="radio"
										value={file}
										id={file}
										on:change={() => form1.requestSubmit()}
										bind:group={$fileSelected}
										checked={file === get(fileSelected)}
									/>
									<label for={file} class:selected={file === $fileSelected}>
										<div class="inline mr-5 relative bottom-1" style="display: inline;">
											{@html icons.file}
										</div>
										{file}
									</label>
								</div>
							{/each}
							<input hidden tabindex="-1" name="path" type="text" bind:value={data.path} />
						</fieldset>
					{/if}
				</form>
			{/if}
			<div id="ui-switch" class:disabled={!$fileSelected}>
				<div class:equal-width={code} class="input-wrapper">
					<input
						type="radio"
						name="shown-ui"
						id="html"
						disabled={!$fileSelected}
						bind:group={uiActive}
						on:change={(e) => {
							// @ts-ignore
							uiActive = e.currentTarget.id;
						}}
						value="html"
						checked={uiActive === 'html'}
					/>
					<label for="html" class:active={uiActive === 'html'} class:equal-width={code}>HTML</label>
				</div>
				<div class:equal-width={code} class="input-wrapper">
					<input
						type="radio"
						name="shown-ui"
						id="text"
						disabled={!$fileSelected}
						bind:group={uiActive}
						on:change={(e) => {
							// @ts-ignore
							uiActive = e.currentTarget.id;
						}}
						value="text"
						checked={uiActive === 'text'}
					/>
					<label for="text" class:active={uiActive === 'text'} class:equal-width={code}>Text</label>
				</div>
				{#if code}
					<div class="input-wrapper">
						<input
							type="radio"
							name="shown-ui"
							id="code"
							disabled={!$fileSelected}
							bind:group={uiActive}
							on:change={(e) => {
								// @ts-ignore
								uiActive = e.currentTarget.id;
							}}
							checked={uiActive === 'code'}
							value="code"
						/>
						<label for="code" class:active={uiActive === 'code'} class:equal-width={code}
							>Code</label
						>
					</div>
				{/if}
			</div>
			<button
				disabled={!$fileSelected}
				id="send-toggle"
				style=""
				class:show={form2Expanded}
				class="drop-down"
				on:click={() => {
					if (form1Expanded && !form2Expanded) form1Expanded = false;
					form2Expanded = !form2Expanded;
				}}
			>
				<div>
					{@html icons.mail}
					<div class:rotate={form2Expanded} class="chevron">
						{@html icons.chevron}
					</div>
				</div>
			</button>
			{#if form2Expanded && !form1Expanded}
				<form
					method="POST"
					use:enhance={() => {
						sending = true;
						return async ({ result }) => {
							sending = false;
							message = null;
							await timer(5);
							//@ts-ignore

							if (result.type !== 'success') {
								success = false;
								message = 'Server error... try again!';
							} else if (result.data?.success === true) {
								success = true;
								message = null;
								//@ts-ignore
							} else if (result.data?.success === false) {
								success = false;
								message =
									result.data?.error && typeof result.data?.error === 'object'
										? JSON.stringify(result.data.error)
										: typeof result.data.error === 'string'
										? result.data.error
										: 'Something went wrong... consider debugging the "send" function you have provided.';
							}
							await timer(1500);
							success = null;
						};
					}}
					action="?/send-email"
					bind:this={form2}
					id="send-form"
					class=""
					style=""
				>
					<div class="inputs-wrapper">
						<div class="input-wrapper">
							<label for="component">Component</label>
							<input
								type="text"
								name="component"
								id="component"
								bind:value={$fileSelected}
								readonly
							/>
						</div>
						<div class="input-wrapper">
							<label for="note">Note</label>
							<input
								type="text"
								name="note"
								id="note"
								bind:value={note}
								placeholder="Add a note..."
							/>
						</div>
						<div class="input-wrapper">
							<label for="to">To</label>
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
							/>
						</div>
					</div>
					<input hidden tabindex="-1" name="html" type="text" bind:value={uiSource} />
					<button type="submit" disabled={sending || success}>
						<div class="send" class:hide={sending || success === true || success === false}>
							Send
						</div>
						{#if sending}
							<div>...</div>
						{/if}
						{#if success === true}
							<div>
								{@html icons.check}
							</div>
						{:else if success === false}
							<div>
								{@html icons.error}
							</div>
						{/if}
					</button>
					{#if message}
						<div id="message">{message}</div>
					{/if}
				</form>
			{/if}
		</div>
		<div id="ui-wrapper" style="padding-bottom: {spacingBottom};">
			<div
				id="ui"
				class:focus-out={form2Expanded || form1Expanded}
				bind:clientWidth={w}
				bind:clientHeight={h}
			>
				{#if !$fileSelected && !loadingFile}
					<div id="select-an-email">Select an email</div>
				{:else if uiActive !== 'code'}
					<div id="dimensions">
						{w}px × {h}px
					</div>
				{/if}
				{#if uiActive === 'code'}
					<div id="code">
						{@html code}
					</div>
				{:else}
					<iframe
						srcdoc={uiSource !== '' ? uiSource : 'Nothing to show...'}
						title="html-email-preview"
						width="100%"
						height="100%"
						frameborder="0"
						class=""
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:root {
		--light-100: white;
		--light-300: #dcdcdc;
		--light-500: #b3b3b3;
		--light-700: #323232;
		--dark-100: #323232;
		--dark-300: #484848;
		--dark-500: #666666;
		--dark-700: white;
	}
	@media (prefers-color-scheme: dark) {
		#window,
		#window * {
			--100: var(--dark-100);
			--300: var(--dark-300);
			--500: var(--dark-500);
			--700: var(--dark-700);
		}
	}
	@media (prefers-color-scheme: light) {
		#window,
		#window * {
			--100: var(--light-100);
			--300: var(--light-300);
			--500: var(--light-500);
			--700: var(--light-700);
		}
	}
	#window {
		color: var(--700);
		background-color: var(--100);
	}
	#window * {
		all: initial;
		font-family: inherit;
		color: inherit;
		border-color: inherit;
	}
	#window *:focus-visible:not(input[type='radio']),
	#window input[type='radio']:focus-visible + label {
		outline: 2px auto Highlight;
		outline: 2px auto -webkit-focus-ring-color;
	}
	#window button {
		width: fit-content;
		color: var(--700);
	}
	#window button,
	#window label,
	#window button * {
		/* transition: 0.15s; */
		color: var(--700);
	}
	#window button,
	#window label,
	#window button *,
	#window label * {
		cursor: pointer;
	}
	#window {
		position: absolute;
		z-index: 9999;
		inset: 0;
		width: 100%;
		height: 100svh;
		display: flex;
		margin: 0 auto;
		background-color: white;
	}
	#content {
		background-color: var(--100);
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		overflow: hidden;
	}
	#navigation {
		display: grid;
		display: grid;
		grid-template-rows: auto;
		grid-template-columns: repeat(3, minmax(auto, 1fr));
		row-gap: 0;
		padding: 0 1rem;
		@media (min-width: 475px) {
			padding: 0 4rem;
		}
	}
	#window button.drop-down {
		width: fit-content;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0px 12px;
		color: var(--700);
		border: 1px solid var(--300);
		border-radius: 100vw;
		background-color: var(--300);
	}
	#window button.drop-down * {
		color: inherit;
	}
	#window button.drop-down.show {
		color: var(--100);
		background-color: var(--700);
	}
	#window button.drop-down.show * {
		color: var(--100);
	}
	#window button.drop-down > * {
		display: flex;
	}
	#window button.drop-down .chevron {
		display: flex;
		margin-left: 8px;
	}
	#window button.drop-down .chevron.rotate {
		transform: rotate(180deg);
	}
	#window button#send-toggle {
		height: 32px;
		padding: 0px 12px;
		margin-left: auto;
		margin-right: 0;
	}
	#window *[disabled],
	#window *[disabled] *,
	#window *.disabled,
	#window *.disabled *,
	#window *[disabled] ~ label {
		opacity: 50%;
		cursor: not-allowed;
	}
	#ui-switch {
		display: flex;
		width: fit-content;
		margin: 0 auto;
		border: 1px solid;
		border-color: var(--300);
		border-radius: 100vw;
		background-color: var(--300);
		padding: 4px;
	}
	#ui-switch .input-wrapper.equal-width {
		width: 50%;
	}
	#ui-switch .input-wrapper {
		/* overflow: hidden; */
		text-align: center;
		border-radius: 100vw;
	}
	#ui-switch .input-wrapper input {
		/* opacity: 0; */
		position: absolute;
	}
	#ui-switch .input-wrapper label {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 0px 8px;
		border-radius: 100vw;
		text-align: center;
	}
	#ui-switch .input-wrapper label.equal-width {
		padding: 0rem 1rem;
	}
	#ui-switch .input-wrapper label.active {
		background-color: var(--700);
		color: var(--100);
	}
	/* #ui-switch .input-wrapper:first-child label {
		border-top-left-radius: 100vw;
		border-bottom-left-radius: 100vw;
	}
	#ui-switch .input-wrapper:last-child label {
		border-top-right-radius: 100vw;
		border-bottom-right-radius: 100vw;
	} */
	#files-form {
		grid-row-start: 2;
		grid-row-end: 2;
		grid-column: 1 / 3;
		width: fit-content;
		height: fit-content;
		max-height: 25vh;
		overflow-y: scroll;
		display: flex;
		flex-direction: column;
		margin-top: 1rem;
		padding: 1rem;
		/* border: 1px solid var(--700); */
		background-color: var(--300);
		border-radius: 8px;
		gap: 1rem;
	}
	#files-form fieldset input {
		position: absolute;
		/* opacity: 0; */
	}
	#files-form fieldset label {
		display: flex;
		align-items: center;
		white-space: nowrap;
		padding: 0.5rem 0.5rem;
		border-radius: 4px;
	}
	#files-form fieldset label:hover {
		background-color: var(--300);
	}
	#files-form fieldset label.selected {
		background-color: var(--700);
		color: var(--100);
	}
	#files-form input[hidden] {
		display: none;
		pointer-events: none;
		opacity: 0;
	}
	#send-form {
		grid-row-start: 3;
		grid-row-end: 3;
		grid-column: span 3 / span 3;
		width: fit-content;
		margin-left: auto;
		padding: 1rem;
		background-color: var(--300);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		margin-top: 1rem;
		row-gap: 2rem;
		column-gap: 1rem;
	}
	#send-form .inputs-wrapper {
		width: fit-content;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	#send-form .input-wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.5rem;
	}
	#send-form .input-wrapper input:read-only {
		pointer-events: none;
		background-color: var(--300);
	}
	#send-form .input-wrapper label {
		font-size: 0.8em;
	}
	#send-form .input-wrapper input {
		border: 1px solid var(--500);
		border-radius: 4px;
		background-color: transparent;
		padding: 0.5rem;
	}
	#send-form input::placeholder {
		color: var(--700);
		opacity: 0.75;
	}
	#send-form input[type='email']:invalid,
	#send-form input[type='email']:disabled {
		border-color: red;
	}
	#send-form input[hidden] {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		user-select: none;
	}
	#send-form button {
		height: fit-content;
		position: relative;
		display: flex;
		justify-content: center;
		padding: 0.5rem 2rem;
		border: 1px solid var(--700);
		border-radius: 100vw;
		color: var(--100);
		background-color: var(--700);
	}
	#send-form button * {
		display: flex;
		justify-content: center;
		color: var(--100);
	}
	#send-form button div.hide {
		opacity: 0;
	}
	#send-form button *:not(.send) {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	#send-form #message {
		word-break: break-all;
		max-width: 200px;
	}
	#ui-wrapper {
		max-width: 100%;
		position: relative;
		height: 100%;
		max-height: 100%;
		min-width: 283px;
		min-height: 103px;
		resize: both;
		z-index: 1;
		display: flex;
		background-color: var(--100);
		padding-left: 1rem;
		padding-right: 1rem;
		@media (min-width: 475px) {
			padding-left: 4rem;
			padding-right: 4rem;
		}
	}
	#ui {
		max-width: 100%;
		position: relative;
		width: 100%;
		height: 100%;
		max-height: 100%;
		max-width: 100%;
		display: flex;
		border: 1px solid var(--700);
		border-radius: 8px;
		overflow: hidden;
	}
	#ui.focus-out {
		border-color: var(--300);
	}
	#ui #select-an-email {
		position: absolute;
		inset: 0;
		width: fit-content;
		height: fit-content;
		margin: auto;
		text-align: center;
		color: var(--light-100);
		mix-blend-mode: difference;
	}
	#ui #dimensions {
		position: absolute;
		top: 0.5rem;
		right: 1rem;
		z-index: 10;
		font-size: 0.8em;
		color: var(--light-100);
		mix-blend-mode: difference;
	}
	#ui #code {
		overflow: scroll;
		background-color: transparent;
	}
	#ui iframe {
		width: 100%;
		height: 100%;
		background-color: var(--light-100);
	}
</style>
