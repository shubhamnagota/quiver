import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as config from '@/config';
import { usePrefs } from '@/stores/prefs';
import { ThankYou } from './ThankYou';

vi.mock('@tanstack/react-router', () => ({ Link: (p: { children: React.ReactNode; onClick?: () => void }) => <a onClick={p.onClick}>{p.children}</a> }));

describe('ThankYou', () => {
  beforeEach(() => usePrefs.getState().reset());
  afterEach(() => vi.restoreAllMocks());

  it('appears once after 50 tool uses when donations are set up, and stays dismissed', async () => {
    vi.spyOn(config, 'supportEnabled').mockReturnValue(true);
    usePrefs.setState({ toolUses: 49 });
    const { rerender } = render(<ThankYou />);
    expect(screen.queryByRole('status')).toBeNull();
    usePrefs.setState({ toolUses: 50 });
    rerender(<ThankYou />);
    expect(screen.getByRole('status')).toHaveTextContent('50 tools opened');
    await userEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByRole('status')).toBeNull();
    usePrefs.setState({ toolUses: 120 });
    rerender(<ThankYou />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('never shows when donations are not configured', () => {
    vi.spyOn(config, 'supportEnabled').mockReturnValue(false);
    usePrefs.setState({ toolUses: 500 });
    render(<ThankYou />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
