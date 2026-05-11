import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NutForm } from '@/components/nut-form';

describe('<NutForm />', () => {
  it('renders the textarea and three buttons', () => {
    render(<NutForm />);
    expect(screen.getByLabelText(/D,N,F,C/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compute/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load sample/i })).toBeInTheDocument();
  });

  it('does not render the output card until Compute is clicked', () => {
    render(<NutForm />);
    expect(screen.queryByLabelText('results')).not.toBeInTheDocument();
  });

  it('typing then computing renders the canonical jeep result (NOT 0)', async () => {
    const user = userEvent.setup();
    render(<NutForm />);
    const textarea = screen.getByLabelText(/D,N,F,C/i);
    await user.type(textarea, '10,100,1,10');
    await user.click(screen.getByRole('button', { name: /compute/i }));

    const results = screen.getByLabelText('results');
    expect(within(results).getByText(/X =/)).toBeInTheDocument();
    expect(within(results).getByText(/13\.997/)).toBeInTheDocument();
    expect(within(results).queryByText(/X = 0$/)).not.toBeInTheDocument();
  });

  it('Load sample populates the textarea with all corner cases', async () => {
    const user = userEvent.setup();
    render(<NutForm />);
    await user.click(screen.getByRole('button', { name: /load sample/i }));

    const textarea = screen.getByLabelText(/D,N,F,C/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('10,100,1,10');
    expect(textarea.value).toContain('20,200,1,10');
    expect(textarea.value).toContain('0,100,1,10');
  });

  it('Clear empties both the textarea and the output', async () => {
    const user = userEvent.setup();
    render(<NutForm />);
    const textarea = screen.getByLabelText(/D,N,F,C/i) as HTMLTextAreaElement;
    await user.type(textarea, '5,10,1,10');
    await user.click(screen.getByRole('button', { name: /compute/i }));
    expect(screen.getByLabelText('results')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(textarea.value).toBe('');
    expect(screen.queryByLabelText('results')).not.toBeInTheDocument();
  });

  it('renders an error row for an invalid line and still computes valid ones alongside', async () => {
    const user = userEvent.setup();
    render(<NutForm />);
    const textarea = screen.getByLabelText(/D,N,F,C/i);
    await user.type(textarea, '1,2,3{enter}5,10,1,10');
    await user.click(screen.getByRole('button', { name: /compute/i }));

    expect(screen.getByTestId('result-error')).toBeInTheDocument();
    expect(screen.getByTestId('result-ok')).toBeInTheDocument();
  });

  it('always shows the sample legend table', () => {
    render(<NutForm />);
    expect(screen.getByText(/Sample cases — what each one probes/i)).toBeInTheDocument();
    expect(screen.getByText(/Jeep canonical/i)).toBeInTheDocument();
  });

  it('renders one row per input line even when the same line appears twice', async () => {
    const user = userEvent.setup();
    render(<NutForm />);
    await user.type(screen.getByLabelText(/D,N,F,C/i), '5,10,1,10{enter}5,10,1,10');
    await user.click(screen.getByRole('button', { name: /compute/i }));

    expect(screen.getAllByTestId('result-ok')).toHaveLength(2);
  });

  it('Load sample clears existing results from a previous compute', async () => {
    const user = userEvent.setup();
    render(<NutForm />);
    const textarea = screen.getByLabelText(/D,N,F,C/i) as HTMLTextAreaElement;
    await user.type(textarea, '5,10,1,10');
    await user.click(screen.getByRole('button', { name: /compute/i }));
    expect(screen.getByLabelText('results')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /load sample/i }));
    expect(screen.queryByLabelText('results')).not.toBeInTheDocument();
  });

  it('computing with an empty textarea produces no output card', async () => {
    const user = userEvent.setup();
    render(<NutForm />);
    await user.click(screen.getByRole('button', { name: /compute/i }));
    expect(screen.queryByLabelText('results')).not.toBeInTheDocument();
  });
});
