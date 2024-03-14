import type { RequestEvent } from '@sveltejs/kit';
import { Resend } from 'resend';
import { renderAsPlainText } from "$lib"
import fs from 'fs'

/**
 * Import all Svelte email components file paths.
 * Create a list containing all Svelte email component file names.
 * Return this list to the client.
 */
export type PreviewData = {
  files: string[] | null,
  path: string | null
}

export const emailList = ({ path = '/src/lib/emails', root }: { path?: string, root?: string }): PreviewData => {
  if (!root) {
    const calledFromPath = calledFrom()

    if (!calledFromPath) {
      throw new Error('Could not determine the root of your project. Please pass in the root param manually (e.g. "/home/my-repos/my-project")')
    }

    root = calledFromPath.substring(calledFromPath.indexOf('/'), calledFromPath.indexOf('/src'))
  }

  const files = createEmailComponentList(path, getFiles(root + path))

  if (!files.length) {
    return { files: null, path: null }
  }

  return { files, path }
}

/**
 * 
 * Imports the requested svelte template. 
 * Renders the template into html. 
 */
export const createEmail = {
  'create-email': async (event: RequestEvent) => {
    const data = await event.request.formData()
    const file = data.get('file')
    const path = data.get('path')

    const getEmailComponent = async () => {
      try {
        return (await import(/* @vite-ignore */`${path}/${file}.svelte`)).default
      } catch (e) {
        throw new Error(`Failed to import the selected email component '${file}'. Are you sure you've included the <Head /> component?`)
      }
    }

    const emailComponent = await getEmailComponent()
    const { html } = emailComponent.render()
    const text = renderAsPlainText(html)

    return { html, text }
  }
}

export declare const SendEmailFunction: (
  { from, to, subject, html }: { from: string, to: string, subject: string, html: string }, resendApiKey?: string
) => Promise<{ success: boolean, error?: any }>;

const defaultSendEmailFunction: typeof SendEmailFunction = async ({ from, to, subject, html }, resendApiKey) => {
  // stringify api key to comment out temp
  const resend = new Resend(resendApiKey);

  const resendReq = await resend.emails.send({ from, to, subject, html });

  if (resendReq.error) {
    return { success: false, error: resendReq.error }
  } else {
    return { success: true, error: null }
  }
}

/**
 * Sends the email using the submitted form data. 
 */
export const sendEmail = ({ customSendEmailFunction, resendApiKey }: { customSendEmailFunction?: typeof SendEmailFunction, resendApiKey?: string }) => {
  return {
    'send-email': async (event: RequestEvent): Promise<{ success: boolean, error: any }> => {
      const data = await event.request.formData()

      const email = {
        from: 'svelte-email-tailwind <onboarding@resend.dev>',
        to: `${data.get('to')} `,
        subject: `${data.get('component')} ${data.get('note') ? "| " + data.get('note') : ""} `,
        html: `${data.get('html')} `
      }

      let sent: { success: boolean, error?: any } = { success: false, error: null }

      if (!customSendEmailFunction && resendApiKey) {
        sent = await defaultSendEmailFunction(email, resendApiKey)
      } else if (customSendEmailFunction) {
        sent = await customSendEmailFunction(email)
      } else if (!customSendEmailFunction && !resendApiKey) {
        const error = {
          message: 'Please pass your Resend API key into the "sendEmail" form action, or provide a custom function.'
        }
        return { success: false, error }
      }

      if (sent && sent.error) {
        console.log('Error:', sent.error)
        return { success: false, error: sent.error }
      } else {
        console.log("Email was sent successfully.")
        return { success: true, error: null }
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
