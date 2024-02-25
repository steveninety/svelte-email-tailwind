import { code } from '$lib/emails/welcome-tailwind.svelte?raw&svelte&type=script'

export function build() {
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
  let match
  let props = {}

  while ((match = regexp.exec(code)) !== null) {
    // console.log(`Found ${match[0]} start=${match.index} end=${regexp.lastIndex}.`);

    const stringTillMatch = code.substring(0, match.index)
    const regexp2 = /let \{/g
    let match2
    let startIndex = -1

    // from each instance, go back until finding 'let {'
    while ((match2 = regexp2.exec(stringTillMatch)) !== null) {
      startIndex = match2.index;
    }

    const result = stringTillMatch
      // remove white-space from the end
      .trim()
      // remove closing bracket ('}') from the end  
      .slice(0, -1)
      // keep only the part starting with 
      .substring(startIndex)
      .trim()
      .replace(/^let \{/, '')
      .replace(/ =/g, ':')
      .replace(/(\w+):/g, '"$1":')

    const obj = JSON.parse("{" + result + "}")
    Object.assign(props, obj)
    // console.log(lastMatchIndex !== -1 ? substringBeforeIndex.substring(lastMatchIndex) : null)
  }

  console.log(assignSelectors(props))
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
  console.log(keys)
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



