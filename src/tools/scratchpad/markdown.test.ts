import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders GitHub-flavoured markdown', () => {
    const html = renderMarkdown('# Hi\n\n- [x] done\n\n`code`');
    expect(html).toContain('<h1>Hi</h1>');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('<code>code</code>');
  });

  it('strips scripts and javascript: links', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[click](javascript:alert(1))');
    expect(html).toContain('click');
    expect(html).not.toMatch(/<script|onerror|href="javascript:/);
  });
});
