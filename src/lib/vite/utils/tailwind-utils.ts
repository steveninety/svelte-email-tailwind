export function classesToStyles(classString: string, twClean: string) {
  // 3. transform tw classes to styles
  const cssMap = makeCssMap(twClean)
  const cleanRegex = /[:#\!\-[\]\/\.%]+/g
  // Replace all non-alphanumeric characters with underscores
  const cleanTailwindClasses = classString.replace(cleanRegex, '_').replaceAll('"', '')

  type Conversion = {
    original: string
    cleaned: string
  }

  const conversion = classString.split(' ').map((className: string): Conversion => {
    return {
      original: className,
      cleaned: className.replace(cleanRegex, '_').replaceAll('"', '')
    }
  })

  // Convert tailwind classes to css styles
  const classesNotFound: string[] = []

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
          const match = conversion.find(obj => obj.cleaned === className)
          if (match) classesNotFound.push(match.original)
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
      classesNotFound,
      tw: {
        class: responsiveClasses,
        style: tailwindStyles
      }
    }
  } else {
    return {
      classesNotFound,
      tw: {
        style: tailwindStyles
      }
    }
  }
}


export const cleanCss = (css: string) => {
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

export const makeCssMap = (css: string) => {
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

export const getMediaQueryCss = (css: string) => {
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

