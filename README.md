<div align="center"><strong>Svelte Email Tailwind</strong></div>
<div align="center">Develop emails easily in Svelte using Tailwind.</div>
<br />
<div align="center">
<a href="https://github.com/steveninety/svelte-email-tailwind">Documentation / GitHub</a> 
</div>

# Introduction

This package adds a Tailwind processor and (optionally) a Sveltekit Email Preview/Testing Interface, to the original [Svelte Email](https://github.com/carstenlebek/svelte-email) package, which is based on [react-email](https://github.com/resendlabs/react-email). `svelte-email-tailwind` enables you to code, preview and test email templates with Svelte and Tailwind classes and render them to HTML or plain text.

# Installation

Install the package to your existing SvelteKit project:

```bash title="npm"
npm install svelte-email-tailwind
```

```bash title="pnpm"
pnpm install svelte-email-tailwind
```

# Getting started

## 1. Create an email using Svelte

`$lib/emails/Hello.svelte`

```html
<script>
	import { Button, Hr, Html, Head, Text } from 'svelte-email-tailwind';

	export let name = 'World';
</script>

<Html lang="en">
	<Head>
		<Text class="md:text-[18px] text-[24px]">
			Hello, {name}!
		</Text>
		<Hr />
		<Button href="https://svelte.dev">Visit Svelte</Button>
	</Head>
</Html>
```

## 2. Send email

This example uses SvelteKit and [Resend](https://resend.com/docs/send-with-nodejs) to send the email. You can use any other email service provider.

`src/routes/emails/hello/+server.ts`

```ts
import type { ComponentProps } from 'svelte';
import type Props from '$lib/emails/hello.svelte';
import component from '$lib/emails/hello.svelte';
import { renderTailwind } from 'svelte-email-tailwind';
import { PRIVATE_RESEND_API_KEY } from '$env/static/private'
import { Resend } from 'resend';

const componentProps: ComponentProps<Props> = {
    name: "Steven"
}

const emailHtml = renderTailwind({ component, componentProps })

const resend = new Resend(PRIVATE_RESEND_API_KEY);

resend.emails.send({
    from: 'you@example.com',
    to: 'user@gmail.com',
    subject: 'Hello',
    html: emailHtml
});
```

# Previewing & Testing Emails in Development (SvelteKit only)

Using a designated route, you can preview all your dynamically generated email components.
Upon selecting an email component, the component is dynamically imported and rendered (including tailwind classes) on the server.
This means you'll be able to preview your emails with the exact markup that eventually lands an inbox (unless of course, the email provider manipulates it behind the scenes).

![svelte-email-tailwind-preview-interface](https://raw.githubusercontent.com/steveninety/svelte-email-tailwind/main/static/interface.jpg)

To get started...


## 1. Copy the `email-previews` folder from the [repo](https://github.com/steveninety/svelte-email-tailwind/tree/master/src/routes)

Make sure to include all 3 files:
- +page.server.ts
- +page.svelte
- EmailPreviews.svelte


## 2. (Optionally) install Resend

Test emails are sent using Resend, so [install Resend](https://resend.com/docs/send-with-nodejs) and include the API key in your `.env`.

If desired, you can swap out Resend for another provider such as Nodemailer. 
To do so, adjust the `'send-email'` form action (`+page.server.ts`).


## 3. Start previewing all your emails in the `/email-previews` route

1. Put your email components in the `/src/lib/emails` directory, or change the directory in `+page.server.ts` (in the `emailComponents` variable and `create-email` form action).
2. Preview the styled and plain-text versions of all of your emails.
3. Send the email to yourself to preview it in a real inbox.


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

# Limitations

- This package does not process shorthand arbitrary Tailwind classes such as p-[0, 30px, 12px, 5px]. 

# Integrations

Emails built with Svelte Email Tailwind can be converted into HTML and sent using any email service provider. Here are some examples:

- Nodemailer
- Resend
- SendGrid
- Postmark
- AWS

## Author 

- Steven Polak 

### Author of the original Svelte Email package

- Carsten Lebek ([@carstenlebek](https://twitter.com/carstenlebek1))

#### Authors of the original project [react-email](https://github.com/resendlabs/react-email)

- Bu Kinoshita ([@bukinoshita](https://twitter.com/bukinoshita))
- Zeno Rocha ([@zenorocha](https://twitter.com/zenorocha))
