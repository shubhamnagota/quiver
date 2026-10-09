import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Task-list checkboxes from GFM are read-only; give them an accessible name.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'INPUT' && node.getAttribute('type') === 'checkbox') {
    node.setAttribute('aria-label', node.hasAttribute('checked') ? 'Done' : 'To do');
  }
});

/** Markdown to sanitised HTML; scripts, handlers and javascript: links are stripped. */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(marked.parse(source, { async: false, gfm: true, breaks: true }));
}
