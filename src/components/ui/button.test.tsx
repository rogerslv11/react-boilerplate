import { render, screen } from '@testing-library/react';

import { Button } from '@/components/ui/button';

describe('<Button />', () => {
  it('renders its label', () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('forwards extra class names', () => {
    render(<Button className="extra-class">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('extra-class');
  });
});
