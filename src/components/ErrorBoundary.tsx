import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Changing this resets the boundary, e.g. on navigation to another tool. */
  resetKey?: string;
}

interface State {
  error: Error | null;
  key?: string;
}

const isChunkError = (e: Error) => /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(e.message);

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const chunk = isChunkError(error);
    return (
      <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/5 p-6">
        <h2 className="font-medium">{chunk ? "This tool couldn't load" : 'Something went wrong in this tool'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {chunk
            ? "You may be offline and this tool isn't cached yet, or Quiver was just updated."
            : 'Your input stayed in this browser. Try again, or clear the input if it keeps happening.'}
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-muted p-2 font-mono text-xs">{error.message}</pre>
        <button
          type="button"
          onClick={() => (chunk ? location.reload() : this.setState({ error: null }))}
          className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          {chunk ? 'Reload' : 'Try again'}
        </button>
      </div>
    );
  }
}
