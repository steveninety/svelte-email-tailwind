# renderTailwind

Transform Svelte components with Tailwind CSS classes into HTML email templates.

## 1. Create an email using Svelte and Tailwind

```svelte title="src/$lib/emails/welcome-tailwind.svelte"
<script lang="ts">
	import { Html, Head, Preview, Body, Container, Section, Text, Button, Img, Hr } from '$lib';

	export let firstName: string = 'John';

	const fontFamily = {
		fontFamily:
			'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
	};
</script>

<Html lang="en" class="bg-white">
	<Head />
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
				<Text class="text-[16px] sm:text-[18px] leading-[26px] text-inherit">
					{firstName}, welcome to svelte-email
				</Text>
			</Section>
			<Section>
				<Text class="text-[16px] sm:text-[18px] leading-[26px]">
					A Svelte component library for building responsive emails
				</Text>
				<Button
					class="bg-brand rounded-[4px] p-5 text-white border-2 text-[18px] sm:text-[18px] text-decoration-none text-center 			dislpay-block"
					href="https://github.com/carstenlebek/svelte-email"
				>
					View on GitHub
				</Button>
				<Text class="text-[16px] sm:text-[18px] leading-[26px]">Happy coding!</Text>
			</Section>
			<Section>
				<Hr class="border border-[#8898aa] my-[20px] mx-0" />
				<Text class="text-[14px] sm:text-[16px] text-[#8898aa]">Carsten Lebek</Text>
			</Section>
		</Container>
	</Body>
</Html>
```

## 2. Convert to HTML

```js title="src/routes/api/email/welcome-tailwind/+server.js"
import { renderTailwind } from 'svelte-email'
import type { TailwindConfig } from 'tw-to-css'
import type { ComponentProps } from 'svelte';
import type WelcomeTailwindProps from './welcome-tailwind.svelte';
import WelcomeTailwind from './welcome-tailwind.svelte';


export async function POST({ request }) {

    const { templateName } = await request.json()

    const options = {
        plainText: false,
        pretty: true
    }
    
    const config: TailwindConfig = {
        theme: {
            screens: {
                '2xl': { max: '1535px' },
                xl: { max: '1279px' },
                lg: { max: '1023px' },
                md: { max: '767px' },
                sm: { max: '475px' }
            },
            extend: {
                colors: {
                    brand: '#007291'
                }
            }
        }
    }

    if (templateName === 'welcome-tailwind') {
        const props: ComponentProps<WelcomeTailwindProps> = {  firstName: "Steven" } 
        return await renderTailwind(
            { 
                template: { 
                    component: 
                        WelcomeTailwind 
                    }, 
                props, 
                options 
            }, 
            { 
                useTailwind: true, 
                config: config 
            }
        )
    }
}

```

This will return the following HTML:

```html
<!DOCTYPE html><html id=&quot;__svelte-email&quot; lang=&quot;en&quot; style=&quot;background-color: rgb(255, 255, 255);&quot;><head>
    <meta httpequiv=&quot;Content-Type&quot; content=&quot;text/html; charset=UTF-8&quot;>
   <style>@media(max-width:475px){.sm_bg_black{background-color: rgb(0,0,0) !important;}}</style></head>
  <body style=&quot;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Oxygen-Sans,Ubuntu,Cantarell,&quot;Helvetica Neue&quot;,sans-serif;&quot;><div id=&quot;__svelte-email-preview&quot; style=&quot;display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;&quot;>Welcome to svelte-email
  </div>
    <div>
        <!-- HTML_TAG_START --><!--[if mso | IE]>
          <table role=&quot;presentation&quot; width=&quot;100%&quot; align=&quot;center&quot; style=&quot;max-width:37.5em;&quot; class=&quot;my-0 mx-auto text-black&quot;><tr><td></td><td style=&quot;width:37.5em;background:#ffffff&quot;>
        <![endif]--><!-- HTML_TAG_END -->
    </div>
    <div style=&quot;max-width: 37.5em; margin: 0px auto 0px auto; color: rgb(0, 0, 0);&quot;>
      <img alt=&quot;Svelte logo&quot; src=&quot;https://svelte.dev/svelte-logo-horizontal.svg&quot; width=&quot;200&quot; height=&quot;50&quot; style=&quot;display: block; outline: none; text-decoration: none; margin-top: 0px; margin-bottom: 0px; margin-right: auto;&quot;><p style=&quot;font-size: 16px; line-height: 26px; margin: 16px 0px;&quot;>Steven, welcome to svelte-email
            </p><table style=&quot;width:100%;&quot;align=&quot;center&quot;border=&quot;0&quot; cellpadding=&quot;0&quot; cellspacing=&quot;0&quot; role=&quot;presentation&quot;>
        <tbody>
          <tr style=&quot;display:grid;grid-auto-columns:minmax(0,1fr);grid-auto-flow:column;&quot;>
            
          </tr>
        </tbody>
      </table>
      <p style=&quot;font-size: 16px; line-height: 26px; margin: 16px 0px;&quot;>A Svelte component library for building responsive emails
            </p><a href=&quot;https://github.com/carstenlebek/svelte-email&quot; target=&quot;_blank&quot; style=&quot;line-height: 100%; text-decoration: none; display: inline-block; max-width: 100%; padding: 1.25rem; background-color: rgb(0, 114, 145); border-radius: 4px; color: rgb(255, 255, 255); border-width: 2px; font-size: 16px; text-align: center;&quot; class=&quot;sm_bg_black&quot;><span><!-- HTML_TAG_START --><!--[if mso]><i style=&quot;letter-spacing: 0px;mso-font-width:-100%;mso-text-raise:0&quot; hidden>&nbsp;</i><![endif]--><!-- HTML_TAG_END --></span>
              <span style=&quot;p-x:0;p-y:0;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:0;&quot;>View on GitHub
				</span>
              <span><!-- HTML_TAG_START --><!--[if mso]><i style=&quot;letter-spacing: 0px;mso-font-width:-100%&quot; hidden>&nbsp;</i><![endif]--><!-- HTML_TAG_END --></span></a><p style=&quot;font-size: 16px; line-height: 26px; margin: 16px 0px;&quot;>Happy coding!</p><table style=&quot;width:100%;&quot;align=&quot;center&quot;border=&quot;0&quot; cellpadding=&quot;0&quot; cellspacing=&quot;0&quot; role=&quot;presentation&quot;>
        <tbody>
          <tr style=&quot;display:grid;grid-auto-columns:minmax(0,1fr);grid-auto-flow:column;&quot;>

          </tr>
        </tbody>
      </table>
      <hr style=&quot;width: 100%; border-top: 1px solid #eaeaea; border-width: 1px; border-color: rgb(136,152,170); margin: 20px 0px 20px 0px;&quot;><p style=&quot;font-size: 12px; line-height: 24px; margin: 16px 0px; color: rgb(136, 152, 170);&quot;>Carsten Lebek
            </p><table style=&quot;width:100%;&quot;align=&quot;center&quot;border=&quot;0&quot; cellpadding=&quot;0&quot; cellspacing=&quot;0&quot; role=&quot;presentation&quot;>
        <tbody>
          <tr style=&quot;display:grid;grid-auto-columns:minmax(0,1fr);grid-auto-flow:column;&quot;>
            
            
          </tr>
        </tbody>
      </table>
    </div>
    <div>
        <!-- HTML_TAG_START --><!--[if mso | IE]>
          </td><td></td></tr></table>
          <![endif]--><!-- HTML_TAG_END -->
    </div>
</body></html>

```


## Options

<script>
	import { Chip } from '@svelteness/kit-docs';
</script>

| Name                   | Type      | Description                      |
| ---------------------- | --------- | -------------------------------- |
| <Chip>plainText</Chip> | `boolean` | Convert the email to plain text. |
| <Chip>pretty</Chip>    | `boolean` | Pretty print the HTML.           |

## renderTailwind Params

| Name                   | Type      | Description                      |
| ---------------------- | --------- | -------------------------------- |
| <Chip>template.component</Chip> | `Component` | The Svelte component to render. |
| <Chip>props</Chip>    | `ComponentProps` | The Svelte component props to render. |
| <Chip>options</Chip>    | `typeof options` | The render options (plainText, pretty). |
| <Chip>useTailwind</Chip>    | `boolean` | Indicate if Tailwind classes were used. |
| <Chip>config</Chip>    | `TailwindConfig` | Tailwind configuration. |