import { Filter, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CustomerListParams, CustomerPlan, CustomerStatus } from '../types';

interface CustomerFiltersProps {
  value: CustomerListParams;
  onChange: (next: CustomerListParams) => void;
}

const STATUS_OPTIONS: Array<{ value: CustomerStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
];

const PLAN_OPTIONS: Array<{ value: CustomerPlan | 'all'; label: string }> = [
  { value: 'all', label: 'All plans' },
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function CustomerFilters({ value, onChange }: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search ?? ''}
          onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
          placeholder="Search customers by name or email..."
          className="pl-9"
          aria-label="Search customers"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden="true" />
        <Select
          value={value.status ?? 'all'}
          onValueChange={(next) =>
            onChange({ ...value, status: next as CustomerStatus | 'all', page: 1 })
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.plan ?? 'all'}
          onValueChange={(next) =>
            onChange({ ...value, plan: next as CustomerPlan | 'all', page: 1 })
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
