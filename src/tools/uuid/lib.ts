const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function generateUuids(count: number, uppercase = false): string[] {
  const n = Math.min(Math.max(Math.floor(count), 1), 1000);
  return Array.from({ length: n }, () => {
    const id = crypto.randomUUID();
    return uppercase ? id.toUpperCase() : id;
  });
}
