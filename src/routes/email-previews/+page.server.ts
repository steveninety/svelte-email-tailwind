import type { Actions } from './$types';
import { renderSvelte } from '$lib'
import { renderTailwind } from '$lib'
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css'
// import { PRIVATE_RESEND_API_KEY } from '$env/static/private'
import { Resend } from 'resend';
import { SvelteComponent, type ComponentProps } from 'svelte';
import type WelcomeTailwindProps from '$lib/emails/welcome-tailwind.svelte';
import WelcomeTailwind from '$lib/emails/welcome-tailwind.svelte';
import { build, getValueByBracketNotation } from '$lib/buildEmails';
import * as all from '$lib/emails/welcome-tailwind.svelte?raw&svelte&type=all'
//get ssr output of svelte.compile js as {code, map, dependencies}
import script from '$lib/emails/welcome-tailwind.svelte?raw&svelte&type=script&compilerOptions={"generate":"ssr"}';
import content from '$lib/emails/welcome-tailwind.svelte?raw';
import { compile, walk, parse, preprocess } from 'svelte/compiler';
import * as acorn from 'acorn';
import * as recast from "recast";
import { parseHTML } from 'linkedom';
import fs from 'fs'
import path from 'path'
import { URL } from 'url';
import { cleanCss, getMediaQueryCss } from '$lib/renderTailwind';
import { create_ssr_component } from 'svelte/internal';

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;

let number = 0
const pathToComponent = path.join(__dirname, './src/lib/emails')
// console.log(__dirname)
// console.log(script)

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
// Goal: turn rendering TW classes into inline styles, into a build step, instead of a step for every sent email in production.
// 1. Transform stringified component source code (https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/advanced-usage.md) into AST
// 1.1. Parse src code using the "acorn" lib that's also used by Svelte under the hood (https://github.com/Rich-Harris/estree-walker)
// 1.2. Wrap "acorn" in the "recast" lib (https://github.com/benjamn/recast?tab=readme-ov-file#using-a-different-parser)
// 2. Manipulate AST (inline TW styles). See https://lihautan.com/manipulating-ast-with-javascript/#traversing-an-ast
// 3. Use "recast.print(ast)" to map manipulated AST back into the original source code
// 4. Write it back into the original component file.
// 5. Now, in prod, only the server-side render() step is needed to send an email!



// console.log(preprocessed)

// console.log(ast.html.children[0].children[5].attributes[0].value)
// console.log(ast.html.children)
// const walked = walk(firstCompile.ast, {
//   enter(node, parent, prop, index) {
//     console.log(node)
//   }
// })

/**
 * Import all Svelte email components file paths.
 * Create a list containing all Svelte email component file names.
 * Return this list to the client.
 */

const emailComponents = import.meta.glob(`/src/lib/emails/*.svelte`, { eager: true })

export async function load() {
  if (Object.keys(emailComponents).length === 0) return { emailComponentList: null }
  // console.log(source)

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
    // const props: ComponentProps<WelcomeTailwindProps> = { props: { firstName: '{firstName}' } }
    // const props = build(code)

    const htmlRenderedTailwind = renderTailwind({ component: emailComponent, tailwindConfig })


    const plainText = renderSvelte({
      template: emailComponent,
      options: { plainText: true }
    })

    // OBJECTIVE: transform tailwind classes to inline styles inside the compiled js ssr component file.
    // 1. find every .$$render( $$result, { alt: "Svelte logo", class: "my-0 mr-auto" },
    // 2. JSON.parse the obj after "$$result,"
    // 3. stylify the TW classes and add them as a style prop to the obj
    // 4. stringify the obj and replace the old stringified obj
    // 5. Now these JS files can be imported as ssr components that can be .render()-ed

    const pathToSsrCode = path.join(__dirname, 'welcome-tailwind.js')
    let code = compile(content, { generate: 'ssr' }).js.code


    // 1.
    const regexStart = /\$\$result,\s*{/g
    let matchStart

    while ((matchStart = regexStart.exec(code)) !== null) {
      const stringStartingAtMatch = code.substring(regexStart.lastIndex - 1, code.length)
      const indexStart = code.length - stringStartingAtMatch.length
      const regexEnd = /\}/g
      const match = stringStartingAtMatch
        .substring(0, stringStartingAtMatch.indexOf('}') + 1) // e.g. { class: "text-[16px]" }
        .replace(/\s{2,}/g, ' ').trim() // remove all excess whitespace
        .replace(/(\b\w+\b)(: ")/g, '"$1"$2') // e.g. { class: "text-lg" } -> { "class": "text-lg" }
        .replace(/style:/g, '"style":') // e.g. style: fontFamily -> "style": "fontFamily"
        .replace(/'/g, '"') // replace single with double quotes (only found in values)
      //
      // 2.
      const obj = JSON.parse(match)

      if (obj.class) {

        // 3.
        // If Tailwind was used, proceed to process the Tailwind classes
        const { twi } = tailwindToCSS({ config: tailwindConfig })

        // convert tailwind classes to css
        const tailwindCss = twi(match, {
          merge: false,
          ignoreMediaQueries: false
        })
        // further process the tailwind css
        const cleanTailwindCss = cleanCss(tailwindCss)
        const headStyle = `<style>${getMediaQueryCss(cleanTailwindCss)}</style>`
        // Perform checks so that responsive styles can be processed
        const hasResponsiveStyles = /@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm.test(headStyle)

      }


      // replace the old obj inside the string
      const processedObj = JSON.stringify(obj)

      code =
        code.substring(0, regexStart.lastIndex - 1) // substring up to match
        + processedObj // concat new obj string
        + code.substring(indexStart + stringStartingAtMatch.indexOf('}') + 1) // substring after match
    }
    const startString = '${validate_component(Head, "Head").$$render($$result, {}, {}, {' // change this to find the third {
    const startIndex = code.indexOf(startString)
    const stringAfterStart = code.substring(startIndex, code.length)
    const endIndex = startIndex + stringAfterStart.indexOf('})}')
    const stringAfterEnd = code.substring(endIndex, code.length)
    // console.log(code.length, startIndex + stringAfterEnd.length)
    // console.log(code.slice(endIndex, code.length))
    // console.log(code.slice(startIndex + startString.length, endIndex))
    //3a. If no children already present, Insert: default: () => { return ``; }
    //3b. Else, take the old string and concat the <style> tag.

    fs.writeFileSync('/home/repositories/svelte-email-tailwind/static/welcome-tailwind.js', code, 'utf8')
    const getCompiledEmail = async () => (await import('/static/welcome-tailwind.js')).default
    const compiledEmail = await getCompiledEmail()
    const { html } = compiledEmail.render()

    return { htmlRenderedTailwind: html, plainText }
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
        to: `${data.get('to')} `,
        subject: `${data.get('component')} ${data.get('note') ? "| " + data.get('note') : ""} `,
        html: `${data.get('html')} `
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
