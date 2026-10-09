import { handleArrowNav, pickNext, type Box } from './arrowNav';

const box = (left: number, top: number, width = 100, height = 50): Box => ({ left, top, width, height });

describe('pickNext', () => {
  // 3-column grid with 7 items: rows [0 1 2] [3 4 5] [6]
  const grid = [0, 1, 2, 3, 4, 5, 6].map((i) => box((i % 3) * 120, Math.floor(i / 3) * 70));

  it('moves through a grid by layout', () => {
    expect(pickNext(grid, 1, 'ArrowDown', 'grid')).toBe(4);
    expect(pickNext(grid, 4, 'ArrowUp', 'grid')).toBe(1);
    expect(pickNext(grid, 4, 'ArrowRight', 'grid')).toBe(5);
    expect(pickNext(grid, 3, 'ArrowLeft', 'grid')).toBeNull();
    expect(pickNext(grid, 5, 'ArrowDown', 'grid')).toBe(6);
    expect(pickNext(grid, 6, 'ArrowDown', 'grid')).toBeNull();
    expect(pickNext(grid, 0, 'ArrowUp', 'grid')).toBeNull();
  });

  it('handles uneven rows such as a wide widget above cards', () => {
    const layout = [box(0, 0, 400), box(420, 0, 180), box(0, 80), box(120, 80), box(240, 80), box(360, 80)];
    expect(pickNext(layout, 1, 'ArrowDown', 'grid')).toBe(5);
    expect(pickNext(layout, 3, 'ArrowUp', 'grid')).toBe(0);
  });

  it('follows DOM order in lists and horizontal bars', () => {
    const list = [box(0, 0), box(0, 50), box(0, 100)];
    expect(pickNext(list, 0, 'ArrowDown', 'list')).toBe(1);
    expect(pickNext(list, 2, 'ArrowDown', 'list')).toBeNull();
    expect(pickNext(list, 1, 'ArrowRight', 'list')).toBeNull();
    expect(pickNext(list, 1, 'ArrowRight', 'horizontal')).toBe(2);
    expect(pickNext(list, 1, 'ArrowDown', 'horizontal')).toBeNull();
  });

  it('jumps with Home and End', () => {
    expect(pickNext(grid, 4, 'Home', 'grid')).toBe(0);
    expect(pickNext(grid, 4, 'End', 'list')).toBe(6);
  });
});

describe('handleArrowNav', () => {
  const press = (key: string, target: Element = document.activeElement!) => {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(e);
    return e;
  };

  beforeAll(() => {
    // jsdom has no layout; treat every element as visible.
    Element.prototype.getClientRects = function () {
      return [{}] as unknown as DOMRectList;
    };
  });
  beforeEach(() => document.addEventListener('keydown', handleArrowNav));
  afterEach(() => {
    document.removeEventListener('keydown', handleArrowNav);
    document.body.innerHTML = '';
  });

  it('moves through a list and skips disabled items', () => {
    document.body.innerHTML = `<nav data-arrow-nav="list">
      <a href="#a" data-nav-item>A</a><button data-nav-item disabled>B</button><a href="#c" data-nav-item>C</a></nav>`;
    (document.querySelector('a') as HTMLElement).focus();
    expect(press('ArrowDown').defaultPrevented).toBe(true);
    expect(document.activeElement?.textContent).toBe('C');
    press('ArrowUp');
    expect(document.activeElement?.textContent).toBe('A');
  });

  it('leaves text fields alone', () => {
    document.body.innerHTML = `<div data-arrow-nav="list"><input data-nav-item /><a href="#" data-nav-item>x</a></div>`;
    (document.querySelector('input') as HTMLElement).focus();
    expect(press('ArrowDown').defaultPrevented).toBe(false);
  });

  it('selects radios with arrows, wrapping around', () => {
    const clicked: string[] = [];
    document.body.innerHTML = `<div role="radiogroup">
      <button role="radio">One</button><button role="radio">Two</button><button role="radio">Three</button></div>`;
    document.querySelectorAll('[role=radio]').forEach((r) => r.addEventListener('click', () => clicked.push(r.textContent!)));
    (document.querySelector('[role=radio]') as HTMLElement).focus();
    press('ArrowLeft');
    expect(document.activeElement?.textContent).toBe('Three');
    press('ArrowDown');
    expect(clicked).toEqual(['Three', 'One']);
  });

  it('starts on the first page item when nothing is focused', () => {
    document.body.innerHTML = `<main id="main"><div data-arrow-nav="grid"><a href="#x" data-nav-item>First</a></div></main>`;
    press('ArrowDown', document.body);
    expect(document.activeElement?.textContent).toBe('First');
  });

  it('falls back to the first focusable element when the page has no groups', () => {
    document.body.innerHTML = `
      <aside data-arrow-nav="list" data-nav-region="sidebar"><a href="#s" data-nav-item>Side</a></aside>
      <main id="main"><h1>Tool</h1><textarea aria-label="Input"></textarea></main>`;
    (document.querySelector('aside a') as HTMLElement).focus();
    press('ArrowRight');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Input');
  });

  it('hops from the sidebar into the page and back', () => {
    document.body.innerHTML = `
      <aside data-arrow-nav="list" data-nav-region="sidebar"><a href="#s" data-nav-item aria-current="page">Side</a></aside>
      <main id="main"><div data-arrow-nav="grid"><a href="#x" data-nav-item>Card</a></div></main>`;
    (document.querySelector('aside a') as HTMLElement).focus();
    press('ArrowRight');
    expect(document.activeElement?.textContent).toBe('Card');
    press('ArrowLeft');
    expect(document.activeElement?.textContent).toBe('Side');
  });
});
