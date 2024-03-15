export function matchMultiKeyBracket(input: string): number {
  const splitInit = input.split(/([{}])/);

  let totals = 0

  const brackets = { open: 0, close: 0 }
  type Split = {
    text: string
    length: number
    index: number
    matched?: number
  }
  const split: Split[] = []

  splitInit.forEach((item, i) => {
    split[i] = {
      text: item,
      length: item.length,
      index: 0,
    }
    totals = totals + item.length
    split[i].index = totals
    if (item === "{") {
      brackets.open = brackets.open + 1
    } else if (item === "}") {
      brackets.close = brackets.close + 1
    }
  })

  // This is the bracket we care about!
  const firstOpen: number = split.findIndex(item => item.text === "{")
  // This is the bracket we're currently trying to match (-1 if currently none) 
  let currentOpen = -1
  const unmatched: number[] = []
  let prevUnmatched: number

  const foundMatch = split.some((item, i) => {
    if (item.text === "{") {
      if (currentOpen >= 0) {
        // after finding a match ("}"), currentOpen = -1, meaning we restart the search
        // otherwise, we've run into consecutive "{"
        // console.log(`[${i}] It's an open again... Prev open (${currentOpen}) is unmatched. New open is ${i}.`)
        // so we set the currentOpen to not-matched
        // split2[currentOpen].matched = false
        // and push it into an array of non-matched open-brackets
        unmatched.push(currentOpen)
        // and the most recent not-matched is the last item in that array
        prevUnmatched = unmatched[unmatched.length - 1]
      }
      // set current item as the new open bracket we're trying to match
      currentOpen = i
    }

    if (item.text === "}") {
      if (currentOpen === -1) {
        // console.log(`[${i}] It's a close again... Match ${i} to Prev unmatched (${prevUnmatched}).`)
        // if we find 2 consecutive "}"...
        // this one can be matched to the previously non-matched "{"
        split[prevUnmatched].matched = i
        split[i].matched = prevUnmatched
        // and it can be taken off the unmatched array...
        unmatched.pop()
        // ...so that the most recent not-matched is updated to the new last item.
        prevUnmatched = unmatched[unmatched.length - 1]
      } else {
        // else if it's the first "}" we encounter since matching a pair...
        // ...it's matched to the current "{" that we're trying to match 
        split[currentOpen].matched = i
        split[i].matched = currentOpen
      }
      // console.log(`[${i}] Close found at i=${i}. Match: ${currentOpen}`)

      currentOpen = -1
    }

    // and finally, we've found the matching closing bracket of the first opening bracket!
    return typeof split[firstOpen].matched === 'number'
  })

  if (foundMatch) {
    // find first opening bracket's match, and return the index thereof. 
    return split[split[firstOpen].matched].index
  } else {
    return -1
  }
}

export function matchSingleKeyChar(char: string | undefined, input: string) {
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


export const substituteText = (text: string, start: number, oldPart: string, newPart: string): string => {
  return text.substring(0, start)
    + newPart
    + text.substring(start + oldPart.length)
}

