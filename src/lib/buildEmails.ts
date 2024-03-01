import { compile } from 'svelte/compiler';
import fs from 'fs'
import path from 'path'
import { URL } from 'url';
import { cleanCss, getMediaQueryCss, makeCssMap } from '$lib/renderTailwind';
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css'




/* 
 * PART 1 (X): transform tailwind classes to inline styles inside the compiled js ssr component file.
 * 1. Find every .$$render( $$result, { alt: "Svelte logo", class: "my-0 mr-auto" },
 * 2. JSON.parse the prop obj after "$$result,"
 * 3. stylify the TW classes and add them as a style prop to the obj
 * 4. In the code string, replace the old props obj with the new props obj 
 * 5. Write the code to a .js file. Import this file and call .render({ props }) to generate html.
*/

/* 
 * PART 2 ( ): Create a Vite plugin that executes PART 1 on build-time, for every .svelte email component. 
 * 1.
*/

/* 
 * PART 3 ( ): Release the package (update) 
 * 1. Write documentation 
 * 2. Update NPM package
*/

/* 
 * PART 4 ( ): Adjust the preview interface to the new method
 * 1. Import raw files automatically
 * 2. Process files and write to filesystem
 * 3. Find workaround for HMR endless loop when writing to the file system from a server file.
*/

export async function buildTailwind(rawSvelteCode: string, tailwindConfig: TailwindConfig) {
  const __dirname = new URL('.', import.meta.url).pathname;
  const pathToSsrCode = path.join(__dirname, 'welcome-tailwind.js')

  let code = compile(rawSvelteCode, { generate: 'ssr' }).js.code
  // If Tailwind was used, proceed to process the Tailwind classes
  const { twi } = tailwindToCSS({ config: tailwindConfig })

  // convert tailwind classes to css
  const twCss = twi(code, {
    merge: false,
    ignoreMediaQueries: false
  })

  // further process the tailwind css
  const cleanTwCss = cleanCss(twCss)

  // unique identifier of all prop objects
  const regexStart = /\$\$result,\s*{/g
  let matchStart

  while ((matchStart = regexStart.exec(code)) !== null) {
    const startIndex = regexStart.lastIndex - 1
    const codeSliced = code.substring(startIndex)
    // const indexStart = code.length - codeSliced.length

    const { matchPre: propsRaw } = matchClosingBracket(codeSliced)

    // turn stringified obj into a JSON-praseable obj so we can work with an obj instead of string
    const propsCleaned = propsRaw
      .replace(/\s{2,}/g, ' ').trim() // remove all excess whitespace
      .replace(/(\b\w+\b)(: ")/g, '"$1"$2') // e.g. { class: "text-lg" } -> { "class": "text-lg" }
      .replace(/style:/g, '"style":') // e.g. style: fontFamily -> "style": fontFamily
      // put double quotes around the style value,spread obj"{...obj1, ...obj2}"
      .replace(/"style": \{([^}]*)\}/g, '"style": "{$1}"')
      // todo: put double quotes around the style value if its a single variable name
      .replace(/"style": (\w+)/g, '"style": "$1"')
      .replace(/'/g, '"') // replace single with double quotes (only found in values)

    const propsInlinedTw = inlineTw(JSON.parse(propsCleaned), cleanTwCss)

    const propsFinal = stringifyObj(propsInlinedTw)

    // replace old props obj for the new one
    code = substituteText(code, startIndex, propsRaw, propsFinal)
  }

  const finalCode = substituteHead(code, cleanTwCss)

  fs.writeFileSync(pathToSsrCode, finalCode, 'utf8')
  const getCompiledEmail = async () => (await import('./welcome-tailwind.js')).default
  const compiledEmail = await getCompiledEmail()

  return compiledEmail
}

function matchClosingBracket(queryString: string) {
  const openingBracketCount = queryString
    // match up to first closing bracket, e.g. '{ name: { first: { callMe: 'steven' }' 
    .substring(0, queryString.indexOf('}') + 1)
    // & count opening brackets
    .match(/\{/g)?.length

  if (!openingBracketCount) return {
    matchPre: '',
  }
  // if style prop was a nested obj
  if (openingBracketCount > 2) {
    throw new Error('You have passed in a nested object as a style prop. Email component style props cannot be nested.')
  }

  const closingBracketMatches = queryString.matchAll(/\}/g)

  // find all '}' 
  const closingBrackets = Array.from(closingBracketMatches, (m: RegExpMatchArray) => {
    return {
      start: m.index,
      //@ts-ignore
      end: m.index + m[0].length,
      length: m[0].length
    }
  })

  let match: string = ''

  if (openingBracketCount === 2) {
    // for every additional '{' inbetween, find the next '}'
    closingBrackets.forEach((bracket, i) => {
      // find matching closing bracket 
      if (i === openingBracketCount - 1) {
        // e.g. '{ name: { first: { callMe: 'steven' } } }'
        // @ts-ignore
        match = queryString.substring(0, bracket.start + 1)
      }
    })
  } else if (openingBracketCount === 1) {
    match = queryString.substring(0, queryString.indexOf('}') + 1)
  }
  return {
    matchPre: match,
  }
}

function stringifyObj(obj: { [key: string]: string }): string {
  console.log(obj)
  if (obj.style) {
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

const substituteText = (text: string, start: number, oldPart: string, newPart: string): string => {
  return text.substring(0, start)
    + newPart
    + text.substring(start + oldPart.length)
}

function substituteHead(code: string, twClean: string) {
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
