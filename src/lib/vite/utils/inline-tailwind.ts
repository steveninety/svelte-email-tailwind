import { tailwindToCSS, type TailwindConfig } from 'tw-to-css';
import { matchSingleKeyChar, matchMultiKeyBracket, substituteText } from './string-utils.js';
import { classesToStyles, cleanCss, getMediaQueryCss } from './tailwind-utils.js';

export function inlineTailwind(
	rawSvelteCode: string,
	filepath: string,
	tailwindConfig?: TailwindConfig
) {
	let code = rawSvelteCode;

	// If Tailwind was used, proceed to process the Tailwind classes
	const { twi } = tailwindToCSS({ config: tailwindConfig });

	// grab all tw classes from the code
	const twCss = twi(code, {
		merge: false,
		ignoreMediaQueries: false
	});

	// further process the tailwind css
	const twClean = cleanCss(twCss);

	// replace props and head
	const { code: codeNewProps, classesNotFound } = substituteProps(code, twClean);

	const codeNewHead = substituteHead(codeNewProps, twClean);

	if (classesNotFound?.length) {
		console.warn(
			'WARNING (svelte-email-tailwind): Some classes were not identified as valid Tailwind classes:',
			classesNotFound,
			`Source: ${filepath}`
		);
	}

	return codeNewHead;
}

function substituteProps(
	code: string,
	twClean: string
): { code: string; classesNotFound?: string[] } {
	// Identify a pattern that matches the props on every node.

	/**
	 * Svelte 4 pattern: `$$result, { props }, {}, { default: () =>  ... }`
	 * Svelte 5 pattern: `$$payload, { props, children: ($$payload) => ...  }`,
	 * So now the props are inbetween `$$payload, {` and `children:`
	 * (With the exception of he deepest node in a branch, which has no children.)
	 */

	// `$$payload, {`
	const regexStart = /\$\$payload,\s*{/g;

	let matchStart;
	let count = 0;
	let classesNotFound: string[] = [];

	// Loop all nodes: keep going as long as we find the `$$payload, {` pattern
	while ((matchStart = regexStart.exec(code)) !== null) {
		count++;

		const startIndex = regexStart.lastIndex - 1;
		const codeSliced = code.substring(startIndex);
		const upToChildrenIndex = codeSliced.indexOf('children: ');
		const matchingBracketIndex = matchMultiKeyBracket(codeSliced);

		// Some nodes have no children, so the matched 'children: (' will be from another node, with the result being that the prop string will be too long.
		// In that case we need another way to find the end of the props
		// We do that by matching the opening bracket from regexStart (`$$payload, {`)
		// As a side note, we can't take the matching bracket for nodes WITH children,
		// because the substring up to the closing bracket includes an ENTIRE branch of child nodes AND their props, defeating the point of trying to isolate props per child.
		// What if it's the last node in the last branch?
		// There won't be any later siblings with children, so upToChildrenIndex will be -1
		const hasNoChildren = matchingBracketIndex < upToChildrenIndex || upToChildrenIndex === -1;
		const endIndex = hasNoChildren ? matchingBracketIndex : upToChildrenIndex;

		if (endIndex === -1) {
			console.log(
				`Something went wrong while selecting prop #${count} (no closing bracket was found).`
			);
			return { code };
		}

		const propsStringRaw = codeSliced.substring(0, endIndex);
		const propsStringClean = propsStringRaw.replace(/\s{2,}/g, ' ').trim(); // remove all excess whitespace

		// skip empty props and props without a class key
		if (propsStringClean !== '{}' && propsStringClean.includes('class:')) {
			const { notFound, propsObj } = convertKvs(propsStringClean, twClean);

			classesNotFound = [...classesNotFound, ...notFound];

			// console.log(count)
			// console.log('INPUT:', propsStringClean)
			// console.log('OUTPUT:', propsObj);
			// console.log(" ")

			if (propsObj.replace(/\s+/g, '') === '{}') {
				// don't transform the code if propsObj is empty, to avoid adding in ` ,` which results in invalid js syntax
			} else {
				// replace old props obj for the new one
				code = substituteText(
					code,
					startIndex,
					propsStringRaw,
					// If no children, include the closing bracket ` }` to mark end of node
					// else, exlude it and append ` ,` (end of child already includes the closing bracket)
					// One exception is when 'class' is the only prop and is empty (or ends up empty after taking out the tw-classes)...
					// Because then we end up with invalid syntax
					// like `Head($$payload, { , children:`, should be `Head($$payload, { children:`
					// Solution is to skip transformation if propsObj is empty
					hasNoChildren ? propsObj : propsObj.slice(0, -2) + ', '
				);
			}
		}
	}
	return { code, classesNotFound };
}

function convertKvs(input: string, twClean: string) {
	let objString = '';
	let classString = '';
	let styleString = '';
	let notFound: string[] = [];

	findKvs(input);

	if (classString.length > 0) {
		const { tw, classesNotFound } = classesToStyles(classString.replaceAll('"', ''), twClean);
		notFound = classesNotFound;

		if (tw.class) {
			classString = `"${classString.replaceAll('"', '')} ${tw.class}"`;
			objString = objString.length
				? `${objString}, class: ${classString}`
				: `class: ${classString}`;
		}

		if (tw.style && styleString.length) {
			styleString = `${styleString.replaceAll('"', '')};${tw.style}`;
			objString = `${objString}, styleString: "${styleString}"`;
		} else if (tw.style && !styleString.length) {
			styleString = tw.style;
			objString = objString.length
				? `${objString}, styleString: "${styleString}"`
				: `styleString: "${styleString}"`;
		}
	}

	return {
		notFound,
		propsObj: `{ ${objString} }`
	};

	function findKvs(input: string) {
		// base case is empty string,
		// but an ugly safety measure is to set it at 2
		if (input.length <= 2) {
			return;
		}
		// a = kv without '{ ' or ', '
		const a = input.replace(/\s{2,}/g, ' ').trim();
		//  b = starting index of `key: `
		const b = a.search(/(\b\w+\b|["']([^"'\\]+(?:\\.[^"'\\]*)*)["'])(: )/g);
		// c = string starting at key
		const c = a.substring(b);
		// d = index of k/v separator `:`
		const d = c.search(/(: )/g);
		// e = value
		const e = c.substring(d + 2);
		// f = starting index of value
		const f = e.at(0);

		const kv = {
			key: c.substring(0, d),
			value: c
				.substring(d + 2, d + 2 + matchSingleKeyChar(f, e) + 1)
				// normalize the used quotation marks
				.replaceAll(`'`, `"`)
		};

		if (kv.key === 'class') {
			classString = kv.value;
		} else if (kv.key === 'styleString') {
			styleString = kv.value;
		} else {
			objString = objString + `${objString.length > 0 ? ', ' : ''}` + `${kv.key}: ${kv.value}`;
		}


		// remove the found kv from the beginning of the string and traverse
		// The "+ 2" comes from ": " and ", "
		input = a.substring(kv.key.length + 2 + kv.value.length + 2);

		findKvs(input);
	}
}

function substituteHead(code: string, twClean: string) {
	// 3. Handle responsive head styles

	const headStyle = `<style>${getMediaQueryCss(twClean)}</style>`;

	// const hasResponsiveStyles = /@media[^{]+\{(?<content>[\s\S]+?)\}\s*\}/gm.test(headStyle)
	const startStringPre = 'Head($$payload, {';
	const iS = code.indexOf(startStringPre);

	if (iS === -1) {
		throw new Error('Missing <Head /> component!');
	}

	const stringAfterStart = code.substring(iS);
	const stringToMatchBeforeHeadContent = '$$payload.out += `';
	const indexStartHeadContent =
		stringAfterStart.indexOf(stringToMatchBeforeHeadContent) +
		stringToMatchBeforeHeadContent.length;
	// head-body-tail terminology:
	// head = up to Head content
	// body = Head content
	// tail = after Head content
	const head = iS + indexStartHeadContent;
	const tail = code.indexOf('`', head);
	const body = code.substring(head, tail+1) + headStyle;

	const transformedCode = `${code.substring(0, head) + body + code.substring(tail + 1)}`;

	return transformedCode;
}
