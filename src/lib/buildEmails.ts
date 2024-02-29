import content from '$lib/emails/welcome-tailwind.svelte?raw';
import { compile } from 'svelte/compiler';
import fs from 'fs'
import path from 'path'
import { URL } from 'url';
import { cleanCss, getMediaQueryCss, makeCssMap } from '$lib/renderTailwind';
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css'
import type { ComponentProps } from 'svelte';
import type WelcomeTailwindProps from '$lib/emails/welcome-tailwind.svelte'

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const pathToComponent = path.join(__dirname, './src/lib/emails')
const pathToSsrCode = path.join(__dirname, 'welcome-tailwind.js')
let code = compile(content, { generate: 'ssr' }).js.code

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

// If Tailwind was used, proceed to process the Tailwind classes
const { twi } = tailwindToCSS({ config: tailwindConfig })

// convert tailwind classes to css
const twCss = twi(code, {
  merge: false,
  ignoreMediaQueries: false
})

// further process the tailwind css
const cleanTwCss = cleanCss(twCss)

// OBJECTIVE: transform tailwind classes to inline styles inside the compiled js ssr component file.
// 1. find every .$$render( $$result, { alt: "Svelte logo", class: "my-0 mr-auto" },
// 2. JSON.parse the obj after "$$result,"
// 3. stylify the TW classes and add them as a style prop to the obj
// 4. stringify the obj and replace the old stringified obj
// 5. Now these JS files can be imported as ssr components that can be .render()-ed

export async function buildTailwind() {

  // 1.
  const regexStart = /\$\$result,\s*{/g
  let matchStart

  const matchIndices = Array.from(code.matchAll(regexStart), (m) => {
    return { start: m.index, end: m.index + m[0].length }
  })

  console.log(matchIndices)

  while ((matchStart = regexStart.exec(code)) !== null) {
    const stringStartingAtMatch = code.substring(regexStart.lastIndex - 1, code.length)
    console.log(regexStart.lastIndex)
    const indexStart = code.length - stringStartingAtMatch.length
    // match up to first closing bracket, e.g. '{ name: { first: { callMe: 'steven' }'
    let matchPre = stringStartingAtMatch.substring(0, stringStartingAtMatch.indexOf('}') + 1) // e.g. { class: "text-[16px]" }
    // count all '{'
    const bracketOpenCount = matchPre.match(/\{/g).length
    // find all '}' 
    const bracketCloseCount = stringStartingAtMatch.matchAll(/\}/g)

    // if style prop was a nested obj
    if (bracketCloseCount > 2) {
      throw new Error('You have passed in a nested object as a style prop. Email component style props cannot be nested.')
    }

    // for every additional '{' inbetween, find the next '}'
    if (bracketOpenCount > 1) {
      let i = -1
      for (const bracketClose of bracketCloseCount) {
        i++
        // find matching closing bracket 
        if (i === bracketOpenCount - 1) {
          // e.g. '{ name: { first: { callMe: 'steven' } } }'
          matchPre = stringStartingAtMatch.substring(0, bracketClose.index + 1)
        }
      }
    }

    // turn stringified obj into a JSON-praseable obj so we can work with an obj instead of string
    const match = matchPre
      .replace(/\s{2,}/g, ' ').trim() // remove all excess whitespace
      .replace(/(\b\w+\b)(: ")/g, '"$1"$2') // e.g. { class: "text-lg" } -> { "class": "text-lg" }
      .replace(/style:/g, '"style":') // e.g. style: fontFamily -> "style": fontFamily
      // put double quotes around the style value,spread obj"{...obj1, ...obj2}"
      .replace(/"style": \{([^}]*)\}/g, '"style": "{$1}"')
      // todo: put double quotes around the style value if its a single variable name 
      .replace(/'/g, '"') // replace single with double quotes (only found in values)

    const obj = inlineTw(JSON.parse(match), cleanTwCss)

    const processObj = (obj: { [key: string]: string }): string => {
      if (bracketOpenCount > 1) {
        // The style value is an obj and should not have double quotes around it 
        const jsonObj = JSON.stringify((obj))
        const indexOfStyle = jsonObj.indexOf('"style":') + '"style":'.length
        const substringAfterStyle = jsonObj.substring(indexOfStyle)
        const modifiedSubstring = substringAfterStyle.replace(/"/, '').replace(/"/, '')

        return `${jsonObj.substring(0, indexOfStyle) + modifiedSubstring}`
      } else {
        return `${JSON.stringify(obj)}`
      }
    }

    const processedObj = processObj(obj)

    // replace the old obj inside the string
    const substituteObj = (stringObj: string): string => {
      return `${code.substring(0, regexStart.lastIndex - 1)
        + processedObj
        + code.substring(indexStart + matchPre.length)
        }`
    }

    code = substituteObj(processedObj)
  }

  code = handleHead(code, cleanTwCss)

  fs.writeFileSync(pathToSsrCode, code, 'utf8')
  const getCompiledEmail = async () => (await import('./welcome-tailwind.js')).default
  const compiledEmail = await getCompiledEmail()

  const props: ComponentProps<WelcomeTailwindProps> = { name: { firstName: 'Steven' } }
  const { html } = compiledEmail.render({ props })
  return html
}

function inlineTw(obj: { [k: string]: string }, twClean: string) {
  if (obj.class) {
    // 3. transform tw classes to styles
    const cssMap = makeCssMap(twClean)
    const cleanRegex = /[:#\!\-[\]\/\.%]+/g

    // Replace all non-alphanumeric characters with underscores
    const cleanTailwindClasses = obj.class.replace(cleanRegex, '_')
    // console.log(cleanTailwindClasses)
    // Convert tailwind classes to css styles
    const tailwindStyles = cleanTailwindClasses
      .split(' ')
      .map((className: string) => cssMap[`.${className}`])
      .join('; ')

    // console.log(tailwindStyles)
    // Merge the pre-existing styles with the tailwind styles
    obj.styleString = `${obj.styleString ? (obj.styleString + '; ' + tailwindStyles) : tailwindStyles}`

    // Keep only the responsive classes (styled later in the doc's <head>)
    const classesArray = obj.class
      .split(' ')
      // filter '.sm:' '.lg:' etc.
      .filter((className: string) => className.search(/^.{2}:/) !== -1)

    if (classesArray.length > 0) {
      for (const string of classesArray) {
        // ...and add back the newly formatted responsive classes
        obj.class = string.replace(cleanRegex, '_')
      }
    } else {
      delete obj.class
    }
  }
  return obj
}

function handleHead(code: string, twClean: string) {
  // 3. Handle responsive head styles

  const headStyle = `<style>${getMediaQueryCss(twClean)}</style>`
  // const hasResponsiveStyles = /@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm.test(headStyle)
  const startString = '${validate_component(Head, "Head").$$render($$result, {}, {}, {' // change this to find the third {
  const startIndex = code.indexOf(startString)
  const stringAfterStart = code.substring(startIndex, code.length)
  const endIndex = startIndex + stringAfterStart.indexOf('})}')
  const inbetween = code.slice(startIndex + startString.length, endIndex)

  if (inbetween.includes('default:')) {
    //3a. take the old string and concat the <style> tag.
    const headChildStart = startIndex + startString.length + inbetween.indexOf('`') + 1
    const headChildEnd = startIndex + startString.length + inbetween.lastIndexOf('`')
    const headChildOld = code.substring(headChildStart, headChildEnd)

    // console.log(code.substring(headChildStart, headChildEnd))
    return `${code.substring(0, headChildStart - 1)
      + '`' + headChildOld + headStyle + '`'
      + code.substring(headChildEnd + 1)
      }`
  } else {
    //3b. If no children already present, Insert: default: () => { return ``; }
    const headChildStart = startIndex + startString.length
    const headChildEnd = endIndex
    const headChild = `default: () => { return '${headStyle}'; }`

    return `${code.substring(0, headChildStart)
      + headChild
      + code.substring(headChildEnd)
      }`
  }
}
