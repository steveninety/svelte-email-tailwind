import { renderSvelte } from './renderSvelte'
import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte';
import { tailwindToCSS, type TailwindConfig } from 'tw-to-css'
import { parseHTML } from 'linkedom';

export const renderTailwind = <Component extends SvelteComponent>({ html, component, componentProps, tailwindConfig }:
  {
    html?: string,
    component?: ComponentType<Component>
    componentProps?: ComponentProps<Component>
    tailwindConfig?: TailwindConfig
  }) => {

  let renderedComponent: string

  if (component) {
    // console.log(componentProps)
    renderedComponent = renderSvelte({
      template: component,
      props: componentProps,
    })
  } else if (html) {
    // Hacky method used in development to dynamically generate all emails for preview on the front-end
    renderedComponent = html
  } else {
    throw new Error("Function requires either a Svelte component or an html string.")
  }

  // Turn html string into a virtual DOM that can be queried and manipulated
  const { document } = parseHTML(renderedComponent)

  // If Tailwind was used, proceed to process the Tailwind classes
  const { twi } = tailwindToCSS({ config: tailwindConfig })

  // convert tailwind classes to css
  const tailwindCss = twi(renderedComponent, {
    merge: false,
    ignoreMediaQueries: false
  })
  // further process the tailwind css
  const cleanTailwindCss = cleanCss(tailwindCss)
  const headStyle = getMediaQueryCss(cleanTailwindCss)

  // Perform checks so that responsive styles can be processed
  const hasResponsiveStyles = /@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm.test(headStyle)
  const hasHead = /<head[^>]*>/gm.test(renderedComponent)

  if (hasResponsiveStyles && !hasHead) {
    throw new Error("To use responsive Tailwind styles, you must have a 'head' element in your email component.")
  }

  // Turn tailwind classes into inline styles, and put responsive classes into a <style> in the <head> 
  // This function returns nothing - it manipulates the jsdom object that was created from the rendered component 
  processTailwindClasses(document, cleanTailwindCss)

  // const htmlWithTailwind = dom.serialize()
  const htmlWithTailwind = document.toString()

  return htmlWithTailwind
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

// Recursively loop over the DOM to process the tailwind classes
function processTailwindClasses(parentNode: Document, css: string) {

  const cssMap = makeCssMap(css)
  const headStyle = getMediaQueryCss(css)

  // Recursion stops when there are no more child nodes
  if (parentNode.childNodes.length === 0) return

  const children = parentNode.childNodes as NodeListOf<Element>

  /**
   * Put the forEach in a function that takes parentNode, childNodes componentProps, 
   * then remove childNodes from processTailwindClasses() function params, 
   * and add cssMap to the processTailwindClasses() params
   * Also: try to remove the "insert style into head" from the forEach loop. 
   */
  loopChildren(children)

  function loopChildren(childNodes: NodeListOf<Element>) {

    childNodes.forEach(child => {
      // Put responsive styles in a <style> in the <head>
      if (child.nodeName.toLowerCase() === "head") {
        child.insertAdjacentHTML(
          'beforeend',
          ` <style>${headStyle}</style>`
        )
      }

      // Some style tag values end up being just a ";"
      // To exclude those, look for style text lengths of more than 1
      // @ts-ignore
      const currentStyles = (child.style && child.style.length > 0 && child.style.cssText.length > 1) ? child.style.cssText : null

      if (child.classList && child.classList.length) {
        const classes: string = child.classList.value
        const cleanRegex = /[:#\!\-[\]\/\.%]+/g

        // Replace all non-alphanumeric characters with underscores
        const cleanTailwindClasses = classes
          .replace(cleanRegex, '_')

        // Convert tailwind classes to css styles
        const tailwindStyles = cleanTailwindClasses
          .split(' ')
          .map((className) => cssMap[`.${className}`])
          .join('; ')

        // Merge the pre-existing styles with the tailwind styles
        const mergedStyles = `${currentStyles ? (currentStyles + ';' + tailwindStyles) : tailwindStyles}`

        // @ts-ignore
        child.style.cssText = mergedStyles

        // Keep only the responsive classes
        // These will be styled by the <style> in the <head>
        const classesArray = classes
          .split(' ')
          .filter((className) => className.search(/^.{2}:/) !== -1)

        // remove entire class attribute...
        child.removeAttribute("class")

        if (classesArray.length > 0) {
          for (const string of classesArray) {
            // ...and add back the newly formatted responsive classes
            child.classList.add(string.replace(cleanRegex, '_'))
          }
        }
      }

      // Re-run this function for all the current element's children
      loopChildren(child.childNodes as NodeListOf<Element>)
    })
  }
}


