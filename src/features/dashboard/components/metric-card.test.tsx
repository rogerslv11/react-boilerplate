import { render, screen } from '@testing-library/react';

import { MetricCard } from '@/features/dashboard/components/metric-card';

describe('<MetricCard />', () => {
  it('renders label and formatted value', () => {
    render(
      <MetricCard
        metric={{
          id: 'mrr',
          label: 'Monthly Recurring Revenue',
          value: 1200,
          format: 'currency',
          delta: 10,
          trend: 'up',
          helper: 'vs. last month',
        }}
      />,
    );

    expect(screen.getByText('Monthly Recurring Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    expect(screen.getByText('vs. last month')).toBeInTheDocument();
  });
});
