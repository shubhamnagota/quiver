import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-muted-foreground">
        That page doesn't exist. <Link to="/" className="underline">Go home</Link> or press ⌘K.
      </p>
    </div>
  );
}
