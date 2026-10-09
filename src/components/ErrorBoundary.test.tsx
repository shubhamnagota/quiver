import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;
function Flaky() {
  if (shouldThrow) throw new Error('kaboom');
  return <p>tool works</p>;
}

function Harness() {
  const [key, setKey] = useState('a');
  return (
    <>
      <button onClick={() => setKey('b')}>switch</button>
      <ErrorBoundary resetKey={key}>
        <Flaky />
      </ErrorBoundary>
    </>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it('shows a recoverable error and retries', async () => {
    shouldThrow = true;
    render(<Harness />);
    expect(screen.getByRole('alert')).toHaveTextContent('kaboom');
    shouldThrow = false;
    await userEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('tool works')).toBeInTheDocument();
  });

  it('resets when the reset key changes', async () => {
    shouldThrow = true;
    render(<Harness />);
    shouldThrow = false;
    await userEvent.click(screen.getByText('switch'));
    expect(screen.getByText('tool works')).toBeInTheDocument();
  });

  it('explains chunk load failures', () => {
    function Missing(): never {
      throw new Error('Failed to fetch dynamically imported module: /assets/JsonTool.js');
    }
    render(<ErrorBoundary><Missing /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent("This tool couldn't load");
  });
});
