import DOMPurify from 'dompurify';
import { marked } from 'marked';

/** Markdown to sanitised HTML; scripts, handlers and javascript: links are stripped. */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(marked.parse(source, { async: false, gfm: true, breaks: true }));
}
