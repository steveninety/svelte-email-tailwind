
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css'

let classesNotFound: string[] = []

export default function buildEmail(rawSvelteCode: string, filepath: string, tailwindConfig?: TailwindConfig) {
  let code = rawSvelteCode

  // If Tailwind was used, proceed to process the Tailwind classes
  const { twi } = tailwindToCSS({ config: tailwindConfig })

  // grab all tw classes from the code
  const twCss = twi(code, {
    merge: false,
    ignoreMediaQueries: false
  })

  // further process the tailwind css
  const twClean = cleanCss(twCss)

  // replace props and head
  const codeNewProps = substituteProps(code, twClean)
  const codeNewHead = substituteHead(codeNewProps, twClean)

  if (classesNotFound.length) {
    console.warn(
      'WARNING (svelte-email-tailwind): Some classes were not identified as valid Tailwind classes:',
      classesNotFound,
      `Source: ${filepath}`
    )
  }

  return codeNewHead

}


function substituteProps(code: string, twClean: string) {
  // unique identifier of all prop objects
  const regexStart = /\$\$result,\s*{/g
  let matchStart
  let count = 0

  while ((matchStart = regexStart.exec(code)) !== null) {
    count++
    const startIndex = regexStart.lastIndex - 1
    const codeSliced = code.substring(startIndex)

    // locate the props object
    const propsStringRaw = matchClosingBracket(codeSliced)
    const propsStringClean = propsStringRaw.replace(/\s{2,}/g, ' ').trim() // remove all excess whitespace

    // skip empty props and props without a class key
    if (propsStringClean !== '{}' && propsStringClean.includes('class:')) {
      const propsObj = findKv(propsStringClean, twClean)

      // console.log(count)
      // console.log('INPUT:', propsStringClean)
      // console.log('OUTPUT:', propsObj)
      // console.log(" ")

      // replace old props obj for the new one
      code = substituteText(code, startIndex, propsStringRaw, propsObj)
    }
  }
  return code
}

function findKv(input: string, twClean: string): string {
  let objString = ''
  let classString = ''
  let styleString = ''

  traverse(input)

  if (classString.length > 0) {
    const tw = inlineTw(classString.replaceAll('"', ''), twClean)

    if (tw.class) {
      classString = `"${classString.replaceAll('"', '')} ${tw.class}"`
      objString = objString.length
        ? `${objString}, class: ${classString}`
        : `class: ${classString}`
    }

    if (tw.style && styleString.length) {
      styleString = `${styleString.replaceAll('"', '')};${tw.style}`
      objString = `${objString}, styleString: "${styleString}"`
    } else if (tw.style && !styleString.length) {
      styleString = tw.style
      objString = objString.length
        ? `${objString}, styleString: "${styleString}"`
        : `styleString: "${styleString}"`
    }
  }

  return `{ ${objString} }`

  function traverse(input: string) {

    // base case is empty string,
    // but an ugly safety measure is to set it at 2
    if (input.length <= 2) {
      return
    }

    // a = kv without '{ ' or ', '
    const a = input.replace(/\s{2,}/g, ' ').trim()
    //  b = starting index of `key: `
    const b =
      a.search(/(\b\w+\b)(: )/g) >= 0
        ? a.search(/(\b\w+\b)(: )/g)
        // if no whole word match...
        // ...then account for keys that got wrapped in double quotes 
        // (because of dashes, such as data-attributes)
        : a.search(/"([^"\\]+(?:\\.[^"\\]*)*)"(: )/g)
    // c = string starting at key
    const c = a.substring(b)
    // d = index of k/v separator `:`
    const d = c.search(/(: )/g)
    // e = value
    const e = c.substring(d + 2)
    // f = starting index of value
    const f = e.at(0);

    const kv = {
      key: c.substring(0, d),
      value: c.substring(d + 2, d + 2 + matchChar(f, e) + 1)
        // normalize the used quotation marks
        .replaceAll(`'`, `"`)
    }

    if (kv.key === 'class') {
      classString = kv.value
    } else if (kv.key === 'styleString') {
      styleString = kv.value
    } else {
      objString =
        objString
        + `${objString.length > 0 ? ', ' : ''}`
        + `${kv.key}: ${kv.value}`
    }

    // remove the found kv from the beginning of the string and traverse
    // The "+ 2" comes from ": " and ", "
    input = a.substring(kv.key.length + 2 + kv.value.length + 2)

    traverse(input)
  }
}

function matchChar(char: string | undefined, input: string) {
  if (!char) return 0
  // values that start with a letter or number, 
  // then end at ", " or " }"
  if (
    (/^[a-zA-Z]+$/).test(char)
    // @ts-ignore
    || !isNaN(char)
  ) {
    // KV ends either with a comma if more KVs, or just the object's closing bracket.
    return input.search(",") > 0 ? input.search(",") - 1 : input.search(" }") - 1
  }
  // (???) else it can only be { [ ` ' " (???)
  const charMatch: { char: string, regexp: RegExp } = {
    char: '',
    regexp: /''/g
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
  const openCount = input.substring(0, firstClose + 1).match(charMatch.regexp)?.length
  if (!openCount) {
    // Would be odd, but if no openining char... match value up to next key or end of obj
    return input.search(",") > 0 ? input.search(",") - 1 : input.search(" }") - 1
  }
  const closingBracketMatches = input.matchAll(charMatch.regexp)

  let match: number = -1

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
      const afterMatch = input.substring(
        input.indexOf(
          charMatch.char,
          input.indexOf(charMatch.char) + 1
        ) + 1
      )

      if (afterMatch.substring(0, 2) === ', ' || afterMatch.substring(0, 2) === ' }') {
        // find 2nd occurrence of quotation mark
        match = input.indexOf(charMatch.char, input.indexOf(charMatch.char) + 1)
      } else {
        // end at next occurrence of ', ' or ' }'
        // because in svelte, href="mailto:{email}" -> href: "mailto:" + {email}
        // and mailto:" will be falsely identified as a key,
        // which you can tell by the closing quote not being followed by a comma (next key) or closing bracket (end of obj)
        const shift =
          afterMatch.indexOf(', ') >= 0
            ? afterMatch.indexOf(', ')
            : afterMatch.indexOf(' }')

        match = input.indexOf(charMatch.char, input.indexOf(charMatch.char) + 1) + (shift + 1)
      }
    } else if (char === '[' || char === '{') {
      // find 1st occurrence of closing bracket
      match = input.indexOf(charMatch.char)
    }
  }

  return match
}

function matchClosingBracket(queryString: string) {
  const openingBracketCount = queryString
    // match up to first closing bracket, e.g. '{ name: { first: { nickname: 'steveninety' }' 
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

  const conversion = classString.split(' ').map((className: string) => {
    return {
      original: className,
      cleaned: className.replace(cleanRegex, '_').replaceAll('"', '')
    }
  })
  // Convert tailwind classes to css styles

  // Keep only the responsive classes (styled later in the doc's <head>)
  const breakpointClasses = classString
    .split(' ')
    // filter '.sm:' '.lg:' etc.
    .filter((className: string) => className.search(/^.{2}:/) !== -1)

  const tailwindStyles = cleanTailwindClasses
    .split(' ')
    .map((className: string) => {
      // if class was identified as tw class
      if (cssMap[`.${className}`]) {
        return cssMap[`.${className}`]
        // else if non-found class was not a breakpoint class, it was truly not found
      } else {
        if (
          !breakpointClasses.find(item => {
            return item.replace(cleanRegex, '_').replaceAll('"', '') === className
          })
        ) {
          // store to later warn developer about it
          const { original } = conversion.find(obj => obj.cleaned === className)
          classesNotFound.push(original)
        }
        return
      }
    })
    .filter(className => className !== undefined)
    .join(';')

  // Merge the pre-existing styles with the tailwind styles
  if (breakpointClasses.length > 0) {
    let responsiveClasses = ''

    for (const string of breakpointClasses) {
      // ...and add back the newly formatted responsive classes
      responsiveClasses = responsiveClasses.length
        ? responsiveClasses + ' ' + string.replace(cleanRegex, '_')
        : string.replace(cleanRegex, '_')
    }

    return {
      class: responsiveClasses,
      style: tailwindStyles
    }
  } else {
    return { style: tailwindStyles }
  }
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


