import type { Actions } from './$types';
import { renderSvelte } from '$lib'
import { renderTailwind } from '$lib'
import type { TailwindConfig } from 'tw-to-css'
// import { PRIVATE_RESEND_API_KEY } from '$env/static/private'
import { Resend } from 'resend';
import type { ComponentProps } from 'svelte';
import type WelcomeTailwindProps from '$lib/emails/welcome-tailwind.svelte';
import WelcomeTailwind from '$lib/emails/welcome-tailwind.svelte';
import { compile } from 'svelte/compiler';
import { build, getValueByBracketNotation } from '$lib/buildEmails';
const tailwindConfig: TailwindConfig = {
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
}

/**
 * Import all Svelte email components file paths.
 * Create a list containing all Svelte email component file names.
 * Return this list to the client.
 */

const emailComponents = import.meta.glob(`/src/lib/emails/*.svelte`, { eager: true })

export async function load() {
  if (Object.keys(emailComponents).length === 0) return { emailComponentList: null }
  build()
  return { emailComponentList: createEmailComponentList(emailComponents) }
}

export const actions = {

  /**
   * 
   * Imports the requested svelte template. 
   * Renders the template into html. 
   * Identifies and converts Tailwind classes into responsive (inline) styles.
   */

  'create-email': async (event) => {
    const data = await event.request.formData()

    const emailComponentName = data.get('email-component')

    const getEmailComponent = async () => {
      try {
        return (await import(/* @vite-ignore */`/src/lib/emails/${emailComponentName}.svelte`)).default
      } catch {
        return null
      }
    }

    const emailComponent = await getEmailComponent()
    // const props: ComponentProps<WelcomeTailwindProps> = { firstName: '{firstName}' }
    const props: ComponentProps<WelcomeTailwindProps> = { props: { firstName: '{firstName}' } }
    const htmlRenderedTailwind = renderTailwind({ component: emailComponent, tailwindConfig, })


    const plainText = renderSvelte({
      template: emailComponent,
      options: { plainText: true }
    })

    const myObject = {
      person: {
        names: ['John', 'Doe'],
        age: 30
      },
      address: {
        city: 'New York',
        zip: 10001
      }
    };

    const path1 = 'person.names[0]';
    const result1 = getValueByBracketNotation(myObject, path1);
    console.log(result1);  // Output: John

    return { htmlRenderedTailwind, plainText }
  },

  /**
   * 
   * Sends the email using the received form data. 
   * You can swap out Resend for any other provider.
   * 
   */

  'send-email': async ({ request }): Promise<{ success: boolean }> => {
    const data = await request.formData()
    // stringify api key to comment out temp
    const resend = new Resend('PRIVATE_RESEND_API_KEY');

    async function sendEmail(): Promise<{ success: boolean, error?: any }> {
      const resendReq = await resend.emails.send({
        from: 'Svelte Email Tailwind <onboarding@resend.dev>',
        to: `${data.get('to')}`,
        subject: `${data.get('component')} ${data.get('note') ? "| " + data.get('note') : ""}`,
        html: `${data.get('html')}`
      });

      if (resendReq.error) {
        console.log(resendReq.error)

        return { success: false }
      }

      console.log("Email was sent successfully.")

      return { success: true }
    }

    return await sendEmail()
  },

} satisfies Actions;

/**
 * 
 * Creates an array of names from the record of svelte email component file paths
 */

function createEmailComponentList(paths: typeof emailComponents) {
  const emailComponentList: string[] = [];

  for (const path in paths) {
    if (path.includes(`.svelte`)) {
      const fileName = path.substring(path.lastIndexOf('/') + 1).replace('.svelte', '')
      emailComponentList.push(fileName)
    }
  }

  return emailComponentList
}
