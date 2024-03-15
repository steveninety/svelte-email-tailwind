import { tailwindToCSS, type TailwindConfig } from 'tw-to-css'
import { matchSingleKeyChar, matchMultiKeyBracket, substituteText } from './string-utils.js'
import { classesToStyles, cleanCss, getMediaQueryCss } from './tailwind-utils.js'

export function inlineTailwind(rawSvelteCode: string, filepath: string, tailwindConfig?: TailwindConfig) {
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
  const { code: codeNewProps, classesNotFound } = substituteProps(code, twClean)
  const codeNewHead = substituteHead(codeNewProps, twClean)

  if (classesNotFound?.length) {
    console.warn(
      'WARNING (svelte-email-tailwind): Some classes were not identified as valid Tailwind classes:',
      classesNotFound,
      `Source: ${filepath}`
    )
  }

  return codeNewHead
}

function substituteProps(code: string, twClean: string): { code: string, classesNotFound?: string[] } {
  // unique identifier of all props objects
  const regexStart = /\$\$result,\s*{/g
  let matchStart
  let count = 0
  let classesNotFound: string[] = []

  while ((matchStart = regexStart.exec(code)) !== null) {
    count++

    const startIndex = regexStart.lastIndex - 1
    const codeSliced = code.substring(startIndex)

    // locate the props object
    const endIndex = matchMultiKeyBracket(codeSliced)

    if (endIndex === -1) {
      console.log(`Something went wrong while selecting prop #${count} (no closing bracket was found).`)
      return { code }
    }

    const propsStringRaw = codeSliced.substring(0, endIndex)
    const propsStringClean = propsStringRaw.replace(/\s{2,}/g, ' ').trim() // remove all excess whitespace

    // skip empty props and props without a class key
    if (propsStringClean !== '{}' && propsStringClean.includes('class:')) {
      const { notFound, propsObj } = convertKvs(propsStringClean, twClean)

      classesNotFound = [...classesNotFound, ...notFound]

      // console.log(count)
      // console.log('INPUT:', propsStringClean)
      // console.log('OUTPUT:', propsObj)
      // console.log(" ")

      // replace old props obj for the new one
      code = substituteText(code, startIndex, propsStringRaw, propsObj)
    }
  }
  return { code, classesNotFound }
}

function convertKvs(input: string, twClean: string) {
  let objString = ''
  let classString = ''
  let styleString = ''
  let notFound: string[] = []


  findKvs(input)

  if (classString.length > 0) {
    const { tw, classesNotFound } = classesToStyles(classString.replaceAll('"', ''), twClean)
    notFound = classesNotFound

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

  return {
    notFound,
    propsObj: `{ ${objString} }`,
  }

  function findKvs(input: string) {

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
      value: c.substring(d + 2, d + 2 + matchSingleKeyChar(f, e) + 1)
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

    findKvs(input)
  }
}


function substituteHead(code: string, twClean: string) {
  // 3. Handle responsive head styles

  const headStyle = `<style>${getMediaQueryCss(twClean)}</style>`
  // const hasResponsiveStyles = /@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm.test(headStyle)
  const startStringPre = '${validate_component(Head, "Head").$$render($$result,'
  const iS = code.indexOf(startStringPre)

  if (iS === -1) {
    throw new Error('Missing <Head /> component!')
  }

  // leverage the "matchMultiKeyBracket" function? (which rn only matches the first opening bracket - here I want the third)
  const before1Str = code.substring(0, iS + startStringPre.length)
  const from1Str = code.substring(before1Str.length)
  const open1 = from1Str.indexOf('{')
  const open1Str = from1Str.substring(open1)
  const close1 = matchSingleKeyChar('{', open1Str)
  const inbtwn1 = open1Str.substring(0, close1 + 1)

  const before2Str = code.substring(0, (before1Str.length + open1) + inbtwn1.length)
  const from2Str = code.substring(before2Str.length)
  const open2 = from2Str.indexOf('{')
  const open2Str = from2Str.substring(open2)
  const close2 = matchSingleKeyChar('{', open2Str)
  const inbtwn2 = open2Str.substring(0, close2 + 1)

  const before3Str = code.substring(0, (before2Str.length + open2) + inbtwn2.length)
  const from3Str = code.substring(before3Str.length)
  const open3 = from3Str.indexOf('{')
  const open3Str = from3Str.substring(open3)
  const close3 = matchSingleKeyChar('{', open3Str)
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


