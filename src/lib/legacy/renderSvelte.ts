import { convert } from '@steveninety/html-to-text';
import pretty from 'pretty';
import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte';

export const renderSvelte = <Component extends SvelteComponent>({
  template,
  props,
  options = { plainText: false, pretty: true }
}: {
  template: ComponentType<Component>;
  props?: ComponentProps<Component>;
  options?: {
    plainText?: boolean;
    pretty?: boolean;
  };
}) => {
  const { html } =
    // @ts-ignore
    template.render(props);
  if (options?.plainText) {
    return renderAsPlainText(html);
    // return ''
  }
  const doctype =
    // '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
    ''
  const markup = html;
  const document = `${doctype}${markup}`;
  if (options?.pretty) {
    return pretty(document);
  }
  return document;
};

export const renderAsPlainText = (markup: string) => {
  return convert(markup, {
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: '#__svelte-email-preview', format: 'skip' }
    ]
  });
};