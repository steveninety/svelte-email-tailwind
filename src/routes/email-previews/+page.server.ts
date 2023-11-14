import type { Actions } from './$types';
import { renderSvelte } from 'svelte-email-tailwind'
import { renderTailwind } from 'svelte-email-tailwind'
import type { TailwindConfig } from 'tw-to-css'
import { PRIVATE_RESEND_API_KEY } from '$env/static/private'
import { Resend } from 'resend';

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

        const htmlRenderedTailwind = renderTailwind({ component: emailComponent, tailwindConfig })

        const plainText = renderSvelte({
            template: emailComponent,
            options: { plainText: true }
        })

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

        const resend = new Resend(PRIVATE_RESEND_API_KEY);

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