/**
 * Hands pasted input from the palette (or a global paste) to the tool it opens,
 * without putting it in the URL. Peek during render, clear after mount, so
 * StrictMode's double render still sees it.
 */
let pending: { toolId: string; input: string } | null = null;

export function handOff(toolId: string, input: string) {
  pending = { toolId, input };
}

export function peekHandoff(toolId: string): string | undefined {
  return pending?.toolId === toolId ? pending.input : undefined;
}

export function clearHandoff(toolId: string) {
  if (pending?.toolId === toolId) pending = null;
}
