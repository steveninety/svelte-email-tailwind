import content from '$lib/emails/welcome-tailwind.svelte?raw';
import { compile } from 'svelte/compiler';
import fs from 'fs'
import path from 'path'
import { URL } from 'url';
import { cleanCss, getMediaQueryCss, makeCssMap } from '$lib/renderTailwind';
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css'

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const pathToComponent = path.join(__dirname, './src/lib/emails')

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

// OBJECTIVE: transform tailwind classes to inline styles inside the compiled js ssr component file.
// 1. find every .$$render( $$result, { alt: "Svelte logo", class: "my-0 mr-auto" },
// 2. JSON.parse the obj after "$$result,"
// 3. stylify the TW classes and add them as a style prop to the obj
// 4. stringify the obj and replace the old stringified obj
// 5. Now these JS files can be imported as ssr components that can be .render()-ed

const pathToSsrCode = path.join(__dirname, 'welcome-tailwind.js')
let code = compile(content, { generate: 'ssr' }).js.code
// If Tailwind was used, proceed to process the Tailwind classes
const { twi } = tailwindToCSS({ config: tailwindConfig })

// convert tailwind classes to css
const tailwindCss = twi(code, {
  merge: false,
  ignoreMediaQueries: false
})

// further process the tailwind css
const cleanTailwindCss = cleanCss(tailwindCss)
const headStyle = `<style>${getMediaQueryCss(cleanTailwindCss)}</style>`
// Perform checks so that responsive styles can be processed
const hasResponsiveStyles = /@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm.test(headStyle)

// 1.
const regexStart = /\$\$result,\s*{/g
let matchStart

while ((matchStart = regexStart.exec(code)) !== null) {
  const stringStartingAtMatch = code.substring(regexStart.lastIndex - 1, code.length)
  const indexStart = code.length - stringStartingAtMatch.length
  const regexEnd = /\}/g
  let matchPre = stringStartingAtMatch
    // for every additional '{' inbetween, find the next '}'
    .substring(0, stringStartingAtMatch.indexOf('}') + 1) // e.g. { class: "text-[16px]" }
  // count '{' occurrences (x) and find the x-th '}'
  const bracketOpenCount = matchPre.match(/\{/g).length
  const bracketCloseCount = stringStartingAtMatch.matchAll(/\}/g)

  if (bracketOpenCount > 1) {
    let i = -1
    for (const bracketClose of bracketCloseCount) {
      i++
      if (i === bracketOpenCount - 1) {
        // console.log(`Found ${bracketClose[0]} index=${bracketClose.index}`)
        matchPre = stringStartingAtMatch
          .substring(0, bracketClose.index + 1)
      }
    }
  }

  if (bracketCloseCount > 2) {
    throw new Error('You have passed in a nested object as a style prop. Email component style props cannot be nested.')
  }

  const match = matchPre
    .replace(/\s{2,}/g, ' ').trim() // remove all excess whitespace
    .replace(/(\b\w+\b)(: ")/g, '"$1"$2') // e.g. { class: "text-lg" } -> { "class": "text-lg" }
    .replace(/style:/g, '"style":') // e.g. style: fontFamily -> "style": fontFamily
    // put double quotes around the style value,spread obj"{...obj1, ...obj2}"
    .replace(/"style": \{([^}]*)\}/g, '"style": "{$1}"')
    // todo: put double quotes around the style value if its a single variable name 
    .replace(/'/g, '"') // replace single with double quotes (only found in values)
  const obj = JSON.parse(match)

  // 2.

  if (obj.class) {
    // 3. transform tw classes to styles
    const cssMap = makeCssMap(cleanTailwindCss)
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


  // replace the old obj inside the string
  let processedObj: string
  if (bracketOpenCount > 1) {
    const jsonObj = JSON.stringify((obj))
    const indexOfStyle = jsonObj.indexOf('"style":') + '"style":'.length
    const substringAfterStyle = jsonObj.substring(indexOfStyle)
    const modifiedSubstring = substringAfterStyle.replace(/"/, '').replace(/"/, '')
    // console.log(modifiedSubstring)
    processedObj = jsonObj.substring(0, indexOfStyle) + modifiedSubstring
  } else {
    processedObj = JSON.stringify(obj)
  }

  code =
    code.substring(0, regexStart.lastIndex - 1) // substring up to match
    + processedObj // concat new obj string
    + code.substring(indexStart + matchPre.length) // substring after match
  if (bracketOpenCount > 1) {
    console.log(obj)
    console.log(processedObj)
    // console.log('matchPre: ', matchPre)
  }
  //
}

// 3. Handle responsive head styles
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
  code =
    code.substring(0, headChildStart - 1)
    + '`' + headChildOld + headStyle + '`'
    + code.substring(headChildEnd + 1)
} else {
  //3b. If no children already present, Insert: default: () => { return ``; }
  const headChildStart = startIndex + startString.length
  const headChildEnd = endIndex
  const headChild = `default: () => { return '${headStyle}'; }`
  code =
    code.substring(0, headChildStart)
    + headChild
    + code.substring(headChildEnd)
}

fs.writeFileSync(pathToSsrCode, code, 'utf8')
const getCompiledEmail = async () => (await import('./welcome-tailwind.js')).default
const compiledEmail = await getCompiledEmail()
const { html } = compiledEmail.render()
