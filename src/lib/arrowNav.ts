import { isTyping } from './keyboard';

export type NavMode = 'list' | 'horizontal' | 'grid';
export type NavKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const NAV_KEYS = new Set<string>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
export const isNavKey = (key: string): key is NavKey => NAV_KEYS.has(key);

const cx = (b: Box) => b.left + b.width / 2;
const sameRow = (a: Box, b: Box) => Math.abs(a.top - b.top) < Math.min(a.height, b.height) / 2;

function nearest(indices: number[], boxes: Box[], score: (b: Box) => number): number | null {
  let best: number | null = null;
  for (const i of indices) if (best === null || score(boxes[i]!) < score(boxes[best]!)) best = i;
  return best;
}

/**
 * Picks the item to move to. Lists and horizontal bars follow DOM order; grids
 * follow the on-screen layout, so they work at any column count.
 */
export function pickNext(boxes: Box[], current: number, key: NavKey, mode: NavMode): number | null {
  const last = boxes.length - 1;
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  if (mode === 'list') {
    if (key === 'ArrowDown') return current < last ? current + 1 : null;
    if (key === 'ArrowUp') return current > 0 ? current - 1 : null;
    return null;
  }
  if (mode === 'horizontal') {
    if (key === 'ArrowRight') return current < last ? current + 1 : null;
    if (key === 'ArrowLeft') return current > 0 ? current - 1 : null;
    return null;
  }
  const cur = boxes[current]!;
  const others = boxes.map((_, i) => i).filter((i) => i !== current);
  if (key === 'ArrowRight' || key === 'ArrowLeft') {
    const dir = key === 'ArrowRight' ? 1 : -1;
    const row = others.filter((i) => sameRow(boxes[i]!, cur) && (boxes[i]!.left - cur.left) * dir > 0);
    return nearest(row, boxes, (b) => Math.abs(b.left - cur.left));
  }
  const below = key === 'ArrowDown';
  const candidates = others.filter((i) => {
    const b = boxes[i]!;
    return below ? b.top >= cur.top + cur.height / 2 : b.top + b.height <= cur.top + cur.height / 2;
  });
  if (!candidates.length) return null;
  // The nearest row in that direction, then the item closest horizontally.
  const rowTop = below
    ? Math.min(...candidates.map((i) => boxes[i]!.top))
    : Math.max(...candidates.map((i) => boxes[i]!.top));
  const row = candidates.filter((i) => Math.abs(boxes[i]!.top - rowTop) < boxes[i]!.height / 2);
  return nearest(row, boxes, (b) => Math.abs(cx(b) - cx(cur)));
}

const visible = (el: HTMLElement) => el.getClientRects().length > 0;

function items(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-nav-item]')).filter(
    (el) => visible(el) && !(el as HTMLButtonElement).disabled && el.closest('[data-arrow-nav]') === container,
  );
}

function focus(el: HTMLElement) {
  el.focus();
  el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** First item of the first arrow-nav group in the main content, else its first focusable element. */
function firstInMain(): HTMLElement | undefined {
  for (const group of document.querySelectorAll('#main [data-arrow-nav]')) {
    const first = items(group)[0];
    if (first) return first;
  }
  return Array.from(document.querySelectorAll<HTMLElement>(`#main ${FOCUSABLE}`)).find(visible);
}

function sidebarItem(): HTMLElement | undefined {
  const sidebar = document.querySelector('[data-arrow-nav][data-nav-region="sidebar"]');
  if (!sidebar) return undefined;
  const list = items(sidebar);
  return list.find((el) => el.getAttribute('aria-current') === 'page') ?? list[0];
}

/** ARIA radio group: arrows move the selection, wrapping at the ends. */
function handleRadio(target: HTMLElement, key: NavKey): boolean {
  const group = target.closest('[role="radiogroup"]');
  if (!group) return false;
  const radios = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]')).filter(visible);
  const i = radios.indexOf(target);
  if (i < 0) return false;
  const n = radios.length;
  const next =
    key === 'Home' ? 0 : key === 'End' ? n - 1 : key === 'ArrowRight' || key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n;
  focus(radios[next]!);
  radios[next]!.click();
  return true;
}

/** Global keydown handler: moves focus within [data-arrow-nav] groups and radio groups. */
export function handleArrowNav(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !isNavKey(e.key)) return;
  const target = e.target instanceof HTMLElement ? e.target : null;
  if (!target || isTyping(target)) return;
  const key = e.key;

  if (target.getAttribute('role') === 'radio') {
    if (handleRadio(target, key)) e.preventDefault();
    return;
  }

  const item = target.closest<HTMLElement>('[data-nav-item]');
  const container = item?.closest<HTMLElement>('[data-arrow-nav]');
  if (item && container) {
    const list = items(container);
    const index = list.indexOf(item);
    if (index < 0) return;
    const mode = (container.dataset.arrowNav as NavMode) || 'list';
    const next = pickNext(list.map((el) => el.getBoundingClientRect()), index, key, mode);
    if (next !== null && next !== index) {
      focus(list[next]!);
      e.preventDefault();
      return;
    }
    // Hop between the sidebar and the page.
    const inSidebar = container.dataset.navRegion === 'sidebar';
    const hop = inSidebar && key === 'ArrowRight' ? firstInMain() : !inSidebar && key === 'ArrowLeft' ? sidebarItem() : undefined;
    if (hop) {
      focus(hop);
      e.preventDefault();
    }
    return;
  }

  // Nothing focused yet: ↓ or ↑ starts on the first item of the page.
  if ((key === 'ArrowDown' || key === 'ArrowUp') && (target === document.body || target.id === 'main')) {
    const first = firstInMain();
    if (first) {
      focus(first);
      e.preventDefault();
    }
  }
}
