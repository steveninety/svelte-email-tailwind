import type { RequestEvent } from '@sveltejs/kit';
import { Resend } from 'resend';
import { renderAsPlainText } from "$lib"
import fs from 'fs'

/**
 * Import all Svelte email components file paths.
 * Create a list containing all Svelte email component file names.
 * Return this list to the client.
 */
export const emailList = (path = '/src/lib/emails', root?: string) => {
  if (!root) {
    const calledFromPath = calledFrom()

    if (!calledFromPath) {
      throw new Error('Could not determine the root of your project. Please pass in the root param manually (e.g. "/home/my-repos/my-project")')
    }

    root = calledFromPath.substring(calledFromPath.indexOf('/'), calledFromPath.indexOf('/src'))
  }

  const list = createEmailComponentList(path, getFiles(root + path))

  if (!list.length) {
    return { emailComponentList: null }
  }

  return { emailComponentList: list, emailComponentPath: path }
}

/**
 * 
 * Imports the requested svelte template. 
 * Renders the template into html. 
 */
export const createEmail = {
  'create-email': async (event: RequestEvent) => {
    const data = await event.request.formData()
    const file = data.get('email-component')
    const path = data.get('email-component-path')

    const getEmailComponent = async () => {
      try {
        return (await import(/* @vite-ignore */`${path}/${file}.svelte`)).default
      } catch (e) {
        throw new Error(`Failed to import the selected email component '${file}'. Are you sure you've included the <Head /> component?`)
      }
    }

    const emailComponent = await getEmailComponent()
    const { html } = emailComponent.render()
    const plainText = renderAsPlainText(html)

    return { htmlRenderedTailwind: html, plainText }
  }
}

export declare const SendEmailFunction: (
  { from, to, subject, html }: { from: string, to: string, subject: string, html: string }
) => Promise<{ success: boolean, error?: any }>;

const send: typeof SendEmailFunction = async ({ from, to, subject, html }) => {
  // stringify api key to comment out temp
  const resend = new Resend('PRIVATE_RESEND_API_KEY');

  const resendReq = await resend.emails.send({ from, to, subject, html });

  if (resendReq.error) {
    return { success: false, error: resendReq.error }
  } else {
    return { success: true }
  }
}

/**
 * 
 * Sends the email using the received form data. 
 *
 * @param { typeof SendEmailFunction } sendEmailFunction - the function used to send the email using a provider of choice.
 * @returns { success: boolean, error?: any } returns the success state and error, if any.
 * 
 */
export const sendEmail = (sendEmailFunction = send) => {
  return {
    'send-email': async (event: RequestEvent): Promise<{ success: boolean }> => {
      const data = await event.request.formData()

      const email = {
        from: 'Svelte Email Tailwind <onboarding@resend.dev>',
        to: `${data.get('to')} `,
        subject: `${data.get('component')} ${data.get('note') ? "| " + data.get('note') : ""} `,
        html: `${data.get('html')} `
      }

      const sent = await sendEmailFunction(email)

      if (sent.error) {
        console.log(sent.error)
        return { success: false }
      } else {
        console.log("Email was sent successfully.")
        return { success: true }
      }
    }
  }
}

function calledFrom() {
  return new Error()
    // Access the call stack from the Error object
    .stack
    // Split the call stack into lines and extract the third line
    ?.split('\n')[3]
}

// Recursive function to get files
function getFiles(dir: string, files: string[] = []) {
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const fileList = fs.readdirSync(dir)
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  for (const file of fileList) {
    const name = `${dir}/${file}`
    // Check if the current file/directory is a directory using fs.statSync
    if (fs.statSync(name).isDirectory()) {
      // If it is a directory, recursively call the getFiles function with the directory path and the files array
      getFiles(name, files)
    } else {
      // If it is a file, push the full path to the files array
      files.push(name)
    }
  }
  return files
}

/**
 * 
 * Creates an array of names from the record of svelte email component file paths
 */
function createEmailComponentList(root: string, paths: string[]) {
  const emailComponentList: string[] = [];

  paths.forEach(path => {
    if (path.includes(`.svelte`)) {
      const fileName = path.substring(
        path.indexOf(root) + root.length + 1,
        path.indexOf('.svelte')
      )
      emailComponentList.push(fileName)
    }
  })

  return emailComponentList
}
