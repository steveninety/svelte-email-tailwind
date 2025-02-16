<div align="center"><strong>Svelte Email Tailwind</strong></div>
<div align="center">Develop emails easily in Svelte using Tailwind.</div>
<br />
<div align="center">
<a href="https://github.com/steveninety/svelte-email-tailwind">Documentation / GitHub</a> 
</div>

# Introduction

SVELTE 5 COMPATIBLE since version 2.0.0!

`svelte-email-tailwind` enables you to code, preview and test-send email templates with Svelte and Tailwind classes and render them to HTML or plain text.

- This package adds a Tailwind post-processor to the original [svelte-email](https://github.com/carstenlebek/svelte-email) package.
- Tailwind classes are converted to inline styles on built-time using a Vite plugin.
- In earlier versions, this process took place every time an email was sent (not very efficient).
- This package also provides a Svelte preview component, including utility functions for the server (SvelteKit only).

# Installation

Install the package to your existing Svelte + Vite or SvelteKit project:

```bash title="npm"
npm install svelte-email-tailwind
```

```bash title="pnpm"
pnpm install svelte-email-tailwind
```

# Getting started

## 1. Configure Vite

Import the svelteEmailTailwind Vite plugin, and pass it into the config's `plugins` array.

`vite.config.ts`

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import svelteEmailTailwind from 'svelte-email-tailwind/vite';

const config: UserConfig = {
	plugins: [
		sveltekit(),
		svelteEmailTailwind() // processes .svelte files inside the default '/src/lib/emails' folder
	]
};

export default config;
```

Optional configurations:

- Provide a Tailwind config;
- Provide a custom path to your email folder.

```js
import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import type { TailwindConfig } from 'tw-to-css';
import svelteEmailTailwind from 'svelte-email-tailwind/vite';

const emailTwConfig: TailwindConfig = {
	theme: {
		screens: {
			md: { max: '767px' },
			sm: { max: '475px' }
		},
		extend: {
			colors: {
				brand: 'rgb(255, 62, 0)'
			}
		}
	}
};

const config: UserConfig = {
	plugins: [
		sveltekit(),
		svelteEmailTailwind({
			tailwindConfig: emailTwConfig,
			pathToEmailFolder: '/src/lib/components/emails' // defaults to '/src/lib/emails'
		})
	]
};

export default config;
```

## 2. Create an email using Svelte

`src/lib/emails/Hello.svelte`

```svelte
<script>
	import { Button, Hr, Html, Text, Head } from 'svelte-email-tailwind';

	export let name = 'World';
</script>

<Html lang="en">
	<Head />
	<Text class="md:text-[18px] text-[24px]">
		Hello, {name}!
	</Text>
	<Hr />
	<Button href="https://svelte.dev">Visit Svelte</Button>
</Html>
```

## 3. Render & send an email

This example uses [Resend](https://resend.com/docs/send-with-nodejs) to send the email. You can use any other email service provider (Nodemailer, SendGrid, Postmark, AWS SES...).

`src/routes/emails/hello/+server.ts`

```ts
import { render } from 'svelte/server';
// import { renderAsPlainText } from 'svelte-email-tailwind';
import type { ComponentProps } from 'svelte';
import type HelloProps from 'src/lib/emails/Hello.svelte';
import Hello from 'src/lib/emails/Hello.svelte';
import { PRIVATE_RESEND_API_KEY } from '$env/static/private';
import { Resend } from 'resend';

const componentProps: ComponentProps<HelloProps> = {
	name: 'Steven'
};

const { html } = render(Hello, { props: componentProps });
// Alternatively, render your email as plain text:
// const plainText = renderAsPlainText(html);

const resend = new Resend(PRIVATE_RESEND_API_KEY);

// Send the email using your provider of choice.
resend.emails.send({
	from: 'you@example.com',
	to: 'user@gmail.com',
	subject: 'Hello',
	html: html
	// Or send your plain text:
	// html: plainText
});
```

# Previewing & test-sending emails in development (SvelteKit)

Using a designated route, you can preview all your dynamically retrieved email components.
This means you'll be able to preview your emails with the exact markup that eventually lands an inbox (unless of course, the email provider manipulates it behind the scenes).

![svelte-email-tailwind-preview-interface](https://raw.githubusercontent.com/steveninety/svelte-email-tailwind/main/static/interface.jpg)

To get started...

## 1. Configure a route

Import the PreviewInterface component and pass in the server data as a prop. Customize the email address.

`src/routes/email-previews/+page.svelte`

```svelte
<script lang="ts">
	import PreviewInterface from 'svelte-email-tailwind/preview/PreviewInterface.svelte';
	export let data;
</script>

<PreviewInterface {data} email="name@example.com" />
```

## 2. Configure the server for this route

Return the email component file list from SvelteKit's `load` function using the `emailList` function.
In SvelteKit's `form actions`, pass in `createEmail` (loads files from the server), and `sendEmail` (sends test-emails).

`src/routes/email-previews/+page.server.ts`

```ts
import { createEmail, emailList, sendEmail } from 'svelte-email-tailwind/preview';
import { PRIVATE_RESEND_API_KEY } from '$env/static/private';

export async function load() {
	// return the list of email components
	return emailList();
}

export const actions = {
	// Pass in the two actions. Provide your Resend API key.
	...createEmail,
	...sendEmail({ resendApiKey: PRIVATE_RESEND_API_KEY })
};
```

Optional configurations:

- Provide a custom path to your email components;
- Provide a custom function to send the email using a different provider.

```ts
import {
	createEmail,
	emailList,
	sendEmail,
	SendEmailFunction
} from 'svelte-email-tailwind/preview';
import nodemailer from 'nodemailer';

export async function load() {
	// Customize the path to your email components.
	return emailList({ path: '/src/lib/components/emails' });
}

// Make sure your custom 'send email' function is of type 'SendEmailFunction'.
const sendUsingNodemailer: typeof SendEmailFunction = async ({ from, to, subject, html }) => {
	const transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false,
		auth: {
			user: 'my_user',
			pass: 'my_password'
		}
	});

	const sent = await transporter.sendMail({ from, to, subject, html });

	if (sent.error) {
		return { success: false, error: sent.error };
	} else {
		return { success: true };
	}
};

export const actions = {
	...createEmail,
	// Pass in your custom 'send email' function.
	...sendEmail({ customSendEmailFunction: sendUsingNodemailer })
};
```

## 3. Start developing your emails via the route you've chosen.

Example: http://localhost:5173/email-previews

# Components

A set of standard components to help you build amazing emails without having to deal with the mess of creating table-based layouts and maintaining archaic markup.

- HTML
- Head
- Heading
- Button
- Link
- Img
- Hr
- Text
- Container
- Preview
- Body
- Column
- Section
- Row
- Custom

# HEADS UP! (Limitations & Syntax requirements)

## Limitations & Syntax requirements

- Always include the `<Head />` component.
- For now, class attribute/prop interpolation/variable references will not work (this won't work: `class={someTwClassName}`, `class={`${someTwClassName} w-full`}`, this will work: `class="w-full"`).
- When using arbitrary Tailwind classes that use multiple values, separate them using underscores (example: p-[0_30px_12px_5px]).
- In Svelte email components, stick to the designated components if you use Tailwind classes. If you need custom HTML, use the `<Custom />` component and the "as" property to define the tag. This component defaults to a `<div/>`. Tailwind classes on regular html nodes will not be processed.
- There are ultra-rare cases where the text inside your email component results in syntax errors under the hood. This could happen when you're using code characters such as brackets, or certain strings that break the Vite script. This would require you to change up your text content.

## Ignore "node_invalid_placement_ssr" warnings

`node_invalid_placement_ssr: `<html>` (src/lib/components/Html.svelte:12:0) needs a valid parent element

This can cause content to shift around as the browser repairs the HTML, and will likely result in a `hydration_mismatch` warning.`

You can ignore these warnings, because Svelte thinks you're building for the web and doesn't know you're building emails - so the warnings are not applicable.

# Author

- Steven Polak

## Author of the original Svelte Email package

- Carsten Lebek ([@carstenlebek](https://twitter.com/carstenlebek1))

### Authors of the original project [react-email](https://github.com/resendlabs/react-email)

- Bu Kinoshita ([@bukinoshita](https://twitter.com/bukinoshita))
- Zeno Rocha ([@zenorocha](https://twitter.com/zenorocha))
