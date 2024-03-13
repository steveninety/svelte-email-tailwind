<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { persisted } from 'svelte-persisted-store';
	import { get, writable, type Writable } from 'svelte/store';
	import { onMount } from 'svelte';

	export let data: PageData;
	export let form: ActionData;
	export let spacingTop: string = '1rem';
	export let spacingBottom: string = '1rem';
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
	const code: Writable<string | undefined> = writable();
	$: if (form?.htmlRenderedTailwind) styledHtml = form.htmlRenderedTailwind;
	$: plainText.update((oldValue) => {
		if (oldValue?.length && form?.plainText?.length) {
			if (oldValue !== form.plainText) {
				return `${form.plainText.replace(/\n/g, '<br />')}`;
			} else {
				return oldValue;
			}
		} else {
			return form?.plainText?.replace(/\n/g, '<br />');
		}
	});
	$: code.update((oldValue) => {
		if (oldValue?.length && form?.code?.length) {
			if (oldValue !== form.code) {
				return form.code;
			} else {
				return oldValue;
			}
		} else {
			return form?.code;
		}
	});
	$: if (shownInterface === 'styledHtml') {
		interfaceSrc = styledHtml;
	} else if (shownInterface === 'plainText') {
		interfaceSrc = get(plainText);
	} else if (shownInterface === 'code') {
		interfaceSrc = get(code);
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
			selected.update((value) => (value = null));
		}
		if (get(selected) && formCreateEmail) {
			formCreateEmail.requestSubmit();
		}
	});

	function timer(delay: number = 2000) {
		return new Promise((resolve) => setTimeout(resolve, delay));
	}
</script>

<div id="u">
	<div id="content">
		<div id="navigation" style="padding-top: {spacingTop};">
			<button
				id="files-toggle"
				class:show={showComponentList}
				class="drop-down files-toggle"
				on:click={() => {
					if (showSendEmailForm && !showComponentList) showSendEmailForm = false;
					showComponentList = !showComponentList;
				}}
			>
				<div>
					{@html icons.folder}
					<div class:rotate={showComponentList} class="chevron">
						{@html icons.chevron}
					</div>
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
					id="files-form"
					class:disabled={selectingComponent}
					bind:this={formCreateEmail}
				>
					{#if !data || !data.emailComponentList}
						<div>.svelte files not found / directory not found</div>
					{:else}
						<fieldset style="width: fit-content">
							{#each data.emailComponentList as emailComponent}
								<div class="input-wrapper">
									<input
										name="email-component"
										type="radio"
										value={emailComponent}
										id={emailComponent}
										on:change={() => formCreateEmail.requestSubmit()}
										bind:group={$selected}
										checked={emailComponent === get(selected)}
									/>
									<label for={emailComponent} class:selected={emailComponent === get(selected)}>
										<div class="inline mr-5 relative bottom-1" style="display: inline;">
											{@html icons.file}
										</div>
										{emailComponent}
									</label>
								</div>
							{/each}
							<input
								hidden
								tabindex="-1"
								name="email-component-path"
								type="text"
								bind:value={data.emailComponentPath}
							/>
						</fieldset>
					{/if}
				</form>
			{/if}
			<div id="interface-switch" class:disabled={!$selected}>
				<div class:equal-width={!form?.code} class="input-wrapper">
					<input
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
						class:active={shownInterface === 'styledHtml'}
						class:equal-width={!form?.code}>Styled</label
					>
				</div>
				<div class:equal-width={!form?.code} class="input-wrapper">
					<input
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
						class:active={shownInterface === 'plainText'}
						class:equal-width={!form?.code}>Text</label
					>
				</div>
				{#if form?.code}
					<div class="input-wrapper">
						<input
							type="radio"
							name="shown-interface"
							id="code"
							disabled={!$selected}
							bind:group={shownInterface}
							on:change={(e) => {
								// @ts-ignore
								shownInterface = e.currentTarget.id;
							}}
							checked={shownInterface === 'code'}
							value="code"
						/>
						<label
							for="code"
							class:active={shownInterface === 'code'}
							class:equal-width={!form?.code}>Code</label
						>
					</div>
				{/if}
			</div>
			<button
				disabled={!$selected}
				id="send-toggle"
				style=""
				class:show={showSendEmailForm}
				class="drop-down"
				on:click={() => {
					if (showComponentList && !showSendEmailForm) showComponentList = false;
					showSendEmailForm = !showSendEmailForm;
				}}
			>
				<div>
					{@html icons.mail}
					<div class:rotate={showSendEmailForm} class="chevron">
						{@html icons.chevron}
					</div>
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
					id="send-form"
					class=""
					style=""
				>
					<div class="inputs-wrapper">
						<div class="input-wrapper">
							<label for="component">Component</label>
							<input type="text" name="component" id="component" bind:value={$selected} readonly />
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
					<input hidden tabindex="-1" name="html" type="text" bind:value={interfaceSrc} />
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
				</form>
			{/if}
		</div>
		<div
			id="interface-wrapper"
			style="padding-bottom: {spacingBottom};"
			bind:clientWidth={w}
			bind:clientHeight={h}
		>
			<div id="interface" class:focus-out={showSendEmailForm || showComponentList}>
				{#if !$selected && !selectingComponent}
					<div id="select-an-email">Select an email</div>
				{:else if shownInterface !== 'code'}
					<div id="dimensions">
						{w}px × {h}px
					</div>
				{/if}
				{#if shownInterface === 'code'}
					<div id="code">
						{@html get(code)}
					</div>
				{:else}
					<iframe
						srcdoc={interfaceSrc !== '' ? interfaceSrc : 'Nothing to show...'}
						title="styled-email-preview"
						width="100%"
						height="100%"
						frameborder="0"
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:root {
		--light-100: rgb(238, 238, 238);
		--light-300: #dcdcdc;
		--light-700: #323232;
		--dark-100: #323232;
		--dark-300: #484848;
		--dark-700: rgb(238, 238, 238);
	}
	@media (prefers-color-scheme: dark) {
		#u,
		#u * {
			--100: var(--dark-100);
			--300: var(--dark-300);
			--700: var(--dark-700);
		}
	}
	@media (prefers-color-scheme: light) {
		#u,
		#u * {
			--100: var(--light-100);
			--300: var(--light-300);
			--700: var(--light-700);
		}
	}
	#u {
		color: var(--700);
		background-color: var(--100);
	}
	#u * {
		all: initial;
		font-family: inherit;
		color: inherit;
		currentcolor: inherit;
		border-color: inherit;
	}
	#u *:focus-visible:not(input[type='radio']),
	#u input[type='radio']:focus-visible + label {
		outline: 2px auto Highlight;
		outline: 2px auto -webkit-focus-ring-color;
	}
	#u button {
		width: fit-content;
		color: var(--700);
	}
	#u button,
	#u label,
	#u button * {
		transition: 0.15s;
		color: var(--700);
	}
	#u button,
	#u label,
	#u button *,
	#u label * {
		cursor: pointer;
	}
	#u {
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
	#u button.drop-down {
		width: fit-content;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.1rem 0.5rem;
		color: var(--700);
		border: 2px solid var(--300);
		border-radius: 100vw;
	}
	#u button.drop-down * {
		color: inherit;
	}
	#u button.drop-down:hover {
		border-color: var(--700);
	}
	#u button.drop-down.show {
		color: var(--100);
		background-color: var(--700);
		border-color: var(--700);
	}
	#u button.drop-down.show * {
		color: var(--100);
	}
	#u button.drop-down > * {
		display: flex;
	}
	#u button.drop-down .chevron.rotate {
		transform: rotate(180deg);
	}
	#u button#send-toggle {
		margin-left: auto;
		margin-right: 0;
	}
	#u *[disabled],
	#u *[disabled] *,
	#u *.disabled,
	#u *.disabled *,
	#u *[disabled] ~ label {
		opacity: 50%;
		cursor: not-allowed;
	}
	#interface-switch {
		display: flex;
		width: fit-content;
		margin: 0 auto;
		border: 2px solid;
		border-radius: 100vw;
	}
	#interface-switch .input-wrapper.equal-width {
		width: 50%;
	}
	#interface-switch .input-wrapper {
		/* overflow: hidden; */
		text-align: center;
	}
	#interface-switch .input-wrapper input {
		/* opacity: 0; */
		position: absolute;
	}
	#interface-switch .input-wrapper label {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 0rem 0.5rem;
		text-align: center;
	}
	#interface-switch .input-wrapper label.equal-width {
		padding: 0rem 1rem;
	}
	#interface-switch .input-wrapper label.active {
		background-color: var(--700);
		color: var(--100);
	}
	#interface-switch .input-wrapper label:not(.active):hover {
		background-color: var(--300);
	}
	#interface-switch .input-wrapper:first-child label {
		border-top-left-radius: 100vw;
		border-bottom-left-radius: 100vw;
	}
	#interface-switch .input-wrapper:last-child label {
		border-top-right-radius: 100vw;
		border-bottom-right-radius: 100vw;
	}
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
		border: 2px solid var(--700);
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
		padding: 0.5rem 1rem;
	}
	#files-form fieldset label:hover {
		background-color: var(--300);
	}
	#files-form fieldset label.selected {
		background-color: var(--700);
		color: var(--100);
	}
	#send-form {
		grid-row-start: 3;
		grid-row-end: 3;
		grid-column: span 3 / span 3;
		width: fit-content;
		margin-left: auto;
		padding: 1rem;
		border: 2px solid var(--700);
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
		border: 2px solid var(--300);
		background-color: transparent;
		padding: 0.5rem;
	}
	#send-form input[type='email']:invalid {
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
		border: 2px solid var(--700);
		border-radius: 100vw;
		color: var(--100);
		background-color: var(--700);
	}
	#send-form button * {
		display: flex;
		justify-content: center;
		color: var(--100);
	}
	#send-form button:hover {
		background-color: var(--100);
	}
	#send-form button:hover * {
		color: var(--700);
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
	#interface-wrapper {
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
	#interface {
		max-width: 100%;
		position: relative;
		width: 100%;
		height: 100%;
		max-height: 100%;
		max-width: 100%;
		display: flex;
		border: 2px solid var(--700);
	}
	#interface.focus-out {
		border-color: var(--300);
	}
	#interface #select-an-email {
		position: absolute;
		inset: 0;
		width: fit-content;
		height: fit-content;
		margin: auto;
		text-align: center;
		color: var(--light-100);
		mix-blend-mode: difference;
	}
	#interface #dimensions {
		position: absolute;
		top: 0.5rem;
		right: 1rem;
		z-index: 10;
		font-size: 0.8em;
		color: var(--light-100);
		mix-blend-mode: difference;
	}
	#interface #code {
		overflow: scroll;
		background-color: transparent;
	}
	#interface iframe {
		width: 100%;
		height: 100%;
		background-color: var(--light-100);
	}
</style>
