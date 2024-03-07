import fs from 'fs'
import path from 'path'
import { URL } from 'url';
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css'
import { compile } from 'svelte/compiler';

/* 
 * PART 1 (X): write script to transform tailwind classes to inline styles inside the compiled js ssr component file.
 * 1. Locate the props .$$render($$result, { ... },
 * 2. JSON.parse the prop obj after "$$result,"
 * 3. stylify the TW classes and add them as a style prop to the obj
 * 4. In the code string, replace the old props obj with the new props obj 
 * 5. Write the code to a .js file. Import this file and call .render({ props }) to generate html.
*/

/* 
 * PART 2 (X): Create a Vite plugin that executes PART 1 in BOTH dev AND on build-time, for every .svelte email component. 
*/

/* 
 * PART 3 (X): Adjust the preview interface to the new method
 * 1. With P2 done, nothing really needs to be changed,
 * because importing components on the server will already have the transformed ssr code.
*/

/* 
 * PART 4 ( ): Release the package (update)
 * 1. Export the Vite plugin
 * 1. Write documentation 
 * 2. Update NPM package
*/

let twClean

export default async function buildEmail(rawSvelteCode: string, vite: boolean = false, tailwindConfig?: TailwindConfig) {

  let code: string

  if (vite/*rawSvelteCode.includes('generated by Svelte')*/) {
    code = rawSvelteCode
  } else {
    code = compile(rawSvelteCode, { generate: 'ssr' }).js.code
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
  twClean = cleanTwCss

  // replace props and head
  const codeNewProps = substituteProps(code, cleanTwCss)
  // const codeNewHead = codeNewProps
  const codeNewHead = substituteHead(codeNewProps, cleanTwCss)
  // substituteHead(codeNewProps, cleanTwCss)

  if (vite) {
    return codeNewHead
  } else {
    const __dirname = new URL('.', import.meta.url).pathname;
    const pathToSsrCode = path.join(__dirname, 'ssr-email-tw.js')
    fs.writeFileSync(pathToSsrCode, codeNewHead, 'utf8')
    const getCompiledEmail = async () => (await import('./ssr-email-tw.js')).default
    const compiledEmail = await getCompiledEmail()

    return compiledEmail
  }
}

let count = 0

function substituteProps(code: string, twClean: string) {
  // unique identifier of all prop objects
  const regexStart = /\$\$result,\s*{/g
  let matchStart

  while ((matchStart = regexStart.exec(code)) !== null) {
    count++
    console.log(count)
    const startIndex = regexStart.lastIndex - 1
    const codeSliced = code.substring(startIndex)

    // locate the props object
    const propsStringRaw = matchClosingBracket(codeSliced)
    const propsStringClean = propsStringRaw.replace(/\s{2,}/g, ' ').trim() // remove all excess whitespace
    console.log('Props INPUT:', propsStringClean)
    const propsObj = findKv(propsStringClean)
    console.log('Props OUTPUT:', propsObj)
    console.log(" ")

    // replace old props obj for the new one
    code = substituteText(code, startIndex, propsStringRaw, propsObj)
  }
  return code
}

function findKv(input: string): string {
  // const obj = {}
  let objString = ''
  let classString = ''
  let styleString = ''

  traverse(input)

  console.log('objString before tw:', "{ " + objString + " }")

  if (classString.length > 0) {
    const tw = inlineTw(classString.replaceAll('"', ''), twClean)

    if (tw.class) {
      classString = '"' + classString.replaceAll('"', '') + ' ' + tw.class + '"'
      objString = objString.length
        ? objString + ', class: ' + classString
        : 'class: ' + classString
    }

    if (tw.style && styleString.length > 0) {
      styleString = styleString.replaceAll('"', '') + '; ' + tw.style
      objString = objString + ', styleString: "' + styleString + '"'
    } else if (tw.style && styleString.length === 0) {
      styleString = tw.style
      objString = objString.length > 0
        ? objString + ', styleString: "' + styleString + '"'
        : 'styleString: "' + styleString + '"'
    }
  }

  return "{ " + objString + " }"

  function traverse(input: string) {

    if (input.length <= 2) {
      return
    }

    // a = kv without '{ ' or ', ' 
    const a = input.replace(/\s{2,}/g, ' ').trim()
    //  b = starting index of `key: `
    let b = a.search(/(\b\w+\b)(: )/g)
    // if no whole word match...
    if (b === -1) {
      // ...then account for keys wrapped in double quotes 
      // (because of dashes, such as data-attributes)
      b = a.search(/"([^"\\]+(?:\\.[^"\\]*)*)"(: )/g)
    }
    // c = string starting at key
    const c = a.substring(b)
    // d = index of `:`
    const d = c.search(/(: )/g)
    // e = value
    const e = c.substring(d + 2)
    // f = starting index of value
    const f = e.at(0);
    console.log('INPUT (a):', a)
    console.log('KEY:', c)

    const kv = {
      key: c.substring(0, d),
      // TODO: matchChar() should check if matching char is followed by `, ` or ` }`
      // TODO: if so, end the value at next occurrence of `, ` or ` }` instead of at matching char...
      value: c.substring(d + 2, d + 2 + matchChar(f, e) + 1).replaceAll(`'`, `"`)
    }

    if (kv.key === 'class') {
      console.log('Found class:', kv.value)
      classString = kv.value
    } else if (kv.key === 'styleString') {
      console.log('Found style:', kv.value)
      styleString = kv.value
    } else {
      objString = objString + `${objString.length > 0 ? ', ' : ''}` + kv.key + ': ' + kv.value
    }

    // remove the found kv from the beginning of the string and traverse
    // The "+ 2" comes from ": " and ", "
    input = a.substring(kv.key.length + 2 + kv.value.length + 2)

    traverse(input)
  }
}

function matchChar(char: string, input: string) {
  // @ts-ignore
  if ((/^[a-zA-Z]+$/).test(char) || !isNaN(char)) {
    // KV ends either with a comma if more KVs, or just the object's closing bracket.
    return input.search(",") > 0 ? input.search(",") - 1 : input.search(" }") - 1
  }
  // } else /*if (char === `{` || char === `[` || char === "'" || char === "`")*/ {
  const charMatch: { char: string | null, regexp: RegExp | null } = {
    char: null,
    regexp: null
  }

  switch (char) {
    case "{":
      charMatch.char = "}"
      charMatch.regexp = /\}/g
      break;
    case "[":
      charMatch.char = "]"
      charMatch.regexp = /\]/g
      break;
    case "'":
      charMatch.char = "'"
      charMatch.regexp = new RegExp("\\'", 'g')
      break;
    case "`":
      charMatch.char = "`"
      charMatch.regexp = new RegExp("\\`", 'g')
      break
    case `"`:
      charMatch.char = `"`
      charMatch.regexp = new RegExp(`\\"`, 'g')
      break
  }

  const firstClose = input.indexOf(charMatch.char)
  const openCount = input.substring(0, firstClose + 1).match(charMatch.regexp).length
  const closingBracketMatches = input.matchAll(charMatch.regexp)

  // console.log('closing character:', charMatch.char)

  let match: number

  const closingBrackets = Array.from(closingBracketMatches, (m) => {
    return {
      start: m.index,
      //@ts-ignore
      end: m.index + m[0].length,
      length: m[0].length
    }
  })

  if (openCount >= 2) {
    // for every additional '{' inbetween, find the next '}'
    closingBrackets.forEach((bracket, i) => {
      // find matching closing bracket 
      if (i === openCount - 1) {
        // e.g. '{ name: { first: { callMe: 'steven' } } }'
        match = bracket.end
        // return bracket.end
      }
    })
  } else if (openCount === 1) {
    if (char === '`' || char === '"' || char === "'") {
      // find second occurrence of quotation mark
      match = input.indexOf(charMatch.char, input.indexOf(charMatch.char) + 1)
    } else if (char === '[' || char === '{') {
      // find first occurrence of closing bracket
      match = input.indexOf(charMatch.char)
    }
  }

  // console.log('Closing char. index:', match)
  return match
}

function matchClosingBracket(queryString: string) {
  const openingBracketCount = queryString
    // match up to first closing bracket, e.g. '{ name: { first: { callMe: 'steven' }' 
    .substring(0, queryString.indexOf('}') + 1)
    // & count opening brackets
    .match(/\{/g)?.length

  if (!openingBracketCount) return ''

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

  let match = ''

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

  return match
}

function inlineTw(classString: string, twClean: string) {
  // 3. transform tw classes to styles
  const cssMap = makeCssMap(twClean)
  const cleanRegex = /[:#\!\-[\]\/\.%]+/g
  // Replace all non-alphanumeric characters with underscores
  const cleanTailwindClasses = classString.replace(cleanRegex, '_').replaceAll('"', '')
  // Convert tailwind classes to css styles
  const tailwindStyles = cleanTailwindClasses
    .split(' ')
    .map((className: string) => cssMap[`.${className}`])
    .join('; ')
  console.log('TAILWINDSTYLES:', tailwindStyles)

  // Merge the pre-existing styles with the tailwind styles

  // Keep only the responsive classes (styled later in the doc's <head>)
  const classesArray = classString
    .split(' ')
    // filter '.sm:' '.lg:' etc.
    .filter((className: string) => className.search(/^.{2}:/) !== -1)

  if (classesArray.length > 0) {
    let responsiveClasses = ''

    for (const string of classesArray) {
      // ...and add back the newly formatted responsive classes
      responsiveClasses = responsiveClasses.length
        ? responsiveClasses + ' ' + string.replace(cleanRegex, '_')
        : string.replace(cleanRegex, '_')
    }
    console.log('RESPONSIVE TW:', responsiveClasses)
    return {
      class: responsiveClasses,
      style: tailwindStyles
    }
  } else {
    return { style: tailwindStyles }
  }
}

const substituteText = (text: string, start: number, oldPart: string, newPart: string): string => {
  if (count === 57) {
    console.log(
      // 'START STRING:', text.substring(0, start), '\n',
      'OLD:', oldPart, '\n',
      'NEW', newPart, '\n',
      // 'END STRING', text.substring(start + oldPart.length)
    )
  }
  return text.substring(0, start)
    + newPart
    + text.substring(start + oldPart.length)
}

function substituteHead(code: string, twClean: string) {
  // 3. Handle responsive head styles

  const headStyle = `<style>${getMediaQueryCss(twClean)}</style>`
  // const hasResponsiveStyles = /@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm.test(headStyle)
  const startStringPre = '${validate_component(Head, "Head").$$render($$result,' // change this to find the third {
  const iS = code.indexOf(startStringPre)

  const before1Str = code.substring(0, iS + startStringPre.length)
  const from1Str = code.substring(before1Str.length)
  const open1 = from1Str.indexOf('{')
  const open1Str = from1Str.substring(open1)
  const close1 = matchChar('{', open1Str)
  const inbtwn1 = open1Str.substring(0, close1 + 1)

  const before2Str = code.substring(0, (before1Str.length + open1) + inbtwn1.length)
  const from2Str = code.substring(before2Str.length)
  const open2 = from2Str.indexOf('{')
  const open2Str = from2Str.substring(open2)
  const close2 = matchChar('{', open2Str)
  const inbtwn2 = open2Str.substring(0, close2 + 1)

  const before3Str = code.substring(0, (before2Str.length + open2) + inbtwn2.length)
  const from3Str = code.substring(before3Str.length)
  const open3 = from3Str.indexOf('{')
  const open3Str = from3Str.substring(open3)
  const close3 = matchChar('{', open3Str)
  const inbtwn3 = open3Str.substring(0, close3 + 1)

  const inbtwn3Start = before3Str.length + open3
  const inbtwn3End = inbtwn3Start + inbtwn3.length

  if (inbtwn3.includes('default:')) {
    //3a. take the old string and concat the <style> tag.
    const headChildStart = inbtwn3Start + inbtwn3.indexOf('`') + 1
    const headChildEnd = inbtwn3Start + inbtwn3.lastIndexOf('`')
    const headChildOld = code.substring(headChildStart, headChildEnd)

    return `${code.substring(0, headChildStart)
      + headChildOld + headStyle + '`'
      + code.substring(headChildEnd + 1)
      }`
  } else {
    //3b. If no children already present, Insert: default: () => { return `` }
    return `${code.substring(0, inbtwn3Start + 1)
      + `default: () => { return '${headStyle}' }`
      + code.substring(inbtwn3End - 1)
      }`
  }
}

const cleanCss = (css: string) => {
  let newCss = css
    .replace(/\\/g, '')
    // find all css selectors and look ahead for opening and closing curly braces
    .replace(/[.\!\#\w\d\\:\-\[\]\/\.%\(\))]+(?=\s*?{[^{]*?\})\s*?{/g, (m) => {
      return m.replace(/(?<=.)[:#\!\-[\\\]\/\.%]+/g, '_');
    })
    .replace(/font-family(?<value>[^;\r\n]+)/g, (m, value) => {
      return `font-family${value.replace(/['"]+/g, '')}`;
    });
  return newCss;
}

const makeCssMap = (css: string) => {
  const cssNoMedia = css.replace(/@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm, '');
  const cssMap = cssNoMedia.split('}').reduce((acc, cur) => {
    const [key, value] = cur.split('{');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  return cssMap;
}

const getMediaQueryCss = (css: string) => {
  const mediaQueryRegex = /@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm;
  return (
    css
      .replace(mediaQueryRegex, (m) => {
        return m.replace(/([^{]+\{)([\s\S]+?)(\}\s*\})/gm, (_, start, content, end) => {
          const newContent = (content as string).replace(
            /(?:[\s\r\n]*)?(?<prop>[\w-]+)\s*:\s*(?<value>[^};\r\n]+)/gm,
            (_, prop, value) => {
              return `${prop}: ${value} !important;`;
            }
          );
          return `${start}${newContent}${end}`;
        });
      })
      // only return media queries
      .match(/@media\s*([^{]+)\{([^{}]*\{[^{}]*\})*[^{}]*\}/g)
      ?.join('') ?? ''
  );
}


