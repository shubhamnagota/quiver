import type { ErrorComponentProps } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';

export function RouteError({ error, reset }: ErrorComponentProps) {
  return (
    <div role="alert" className="py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">{error instanceof Error ? error.message : 'Unexpected error'}</p>
      <div className="mt-4 flex justify-center gap-3 text-sm">
        <button type="button" onClick={reset} className="rounded-md border border-border px-3 py-1.5 hover:bg-accent">Try again</button>
        <Link to="/" className="rounded-md border border-border px-3 py-1.5 hover:bg-accent">Go home</Link>
      </div>
    </div>
  );
}
