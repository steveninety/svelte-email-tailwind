import { code } from '$lib/emails/welcome-tailwind.svelte?raw&svelte&type=script'

export function build(code: string) {
  /**
       * Handle arrays / {#each}-block with variable length:
       * - must wrap each block in div with data-attribute representing the exact prop name (snake case) 
       * e.g. "data-purchased_products"
       * for each item in prop array, duplicate the content within the wrapper
       *
       * 
  **/

  //1. Store a JSON stringified (parseable) object containing all props, with their values equal to the prop name
  //Example: { "prop1": "prop1", "prop2": "nestedKey": { "nestedValue": "prop2.nestedKey.nestedValue" } } 

  // find all instances of '= $$props;' and the nearest instance of 'let {' before '= $$props;'
  const regexp = /= \$\$props;/g
  let matchEnd
  let props = {}

  // as long as we find '= $$props;' ...
  while ((matchEnd = regexp.exec(code)) !== null) {
    // console.log(`Found ${matchEnd[0]} start=${matchEnd.index} end=${regexp.lastIndex}.`);
    const stringTillMatch = code.substring(0, matchEnd.index)
    const regexp2 = /let \{/g
    let matchStart
    let matchStartIndex = -1

    // from each instance, find the closest 'let {' BEFORE the matchEnd
    while ((matchStart = regexp2.exec(stringTillMatch)) !== null) {
      matchStartIndex = matchStart.index;
    }

    const result = stringTillMatch
      // remove white-space from the end
      .trim()
      // remove closing bracket ('}') from the end  
      .slice(0, -1)
      // keep only the part starting at 'let {'
      .substring(matchStartIndex)
      // remove 'let {'
      .replace(/^let \{/, '')
      // replace '=' with ':' because turning into (JSON) obj props
      .replace(/ =/g, ':')
      // put double quotes around each prop within '[]' 
      .replace(/(\w+):/g, '"$1":')

    // create a JS object by surrounding with '{}' and parsing
    const obj = JSON.parse("{" + result + "}")
    Object.assign(props, obj)
    // console.log(lastMatchIndex !== -1 ? substringBeforeIndex.substring(lastMatchIndex) : null)
  }

  // console.log(props)
  // console.log(assignSelectors(props))
  return assignSelectors((props))
}

function assignSelectors(obj, objName = 'props') {
  function traverse(obj, path) {
    for (const key in obj) {
      const newPath = path.length === 0 ? `${objName}["${key}"]` : `${path}["${key}"]`;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key], newPath);
      } else {
        // Assign the stringified expression to the deepest value
        if (Array.isArray(obj[key])) {
          obj[key] = `${newPath}[${obj[key].length - 1}]`;
        } else {
          obj[key] = newPath;
        }
      }
    }
  }

  traverse(obj, '');

  return obj;
}



export function getValueByBracketNotation(obj, path) {
  // Split by '[' or ']'
  const keys = path.split(/[\[\]]/).filter(Boolean);
  let value = obj;
  // console.log(keys)
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
      if (value === undefined) {
        // Handle cases where the path is invalid or the value is not found
        return undefined;
      }
    } else {
      // Handle cases where the path is invalid or the value is not found
      return undefined;
    }
  }

  return value;
}



