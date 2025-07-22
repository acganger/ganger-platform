import { TicketFilters as TicketFiltersType, Ticket } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { X } from 'lucide-react';
import { Badge } from '@ganger/ui-catalyst';
import { Input, Select } from '@ganger/ui-catalyst';

interface TicketFiltersProps {
  filters: TicketFiltersType;
  onFiltersChange?: (filters: TicketFiltersType) => void;
}

const statusOptions: { value: Ticket['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'stalled', label: 'Stalled' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'completed', label: 'Completed' },
];

const priorityOptions: { value: Ticket['priority']; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const locationOptions: { value: Ticket['location']; label: string }[] = [
  { value: 'Wixom', label: 'Wixom' },
  { value: 'Ann Arbor', label: 'Ann Arbor' },
  { value: 'Plymouth', label: 'Plymouth' },
];

const formTypeOptions: { value: Ticket['form_type']; label: string }[] = [
  { value: 'support_ticket', label: 'Support Ticket' },
  { value: 'time_off_request', label: 'Time Off Request' },
  { value: 'punch_fix', label: 'Punch Fix' },
  { value: 'change_of_availability', label: 'Change of Availability' },
];

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

const MultiSelect = ({ label, options, selectedValues, onChange }: MultiSelectProps) => {
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {selectedValues.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center space-x-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const TicketFilters = ({ filters, onFiltersChange }: TicketFiltersProps) => {
  const { authUser } = useAuth();

  const updateFilters = (newFilters: Partial<TicketFiltersType>) => {
    onFiltersChange?.({ ...filters, ...newFilters });
  };

  const clearAllFilters = () => {
    onFiltersChange?.({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof TicketFiltersType];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filter Tickets</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Filter */}
        <MultiSelect
          label="Status"
          options={statusOptions}
          selectedValues={filters.status || []}
          onChange={(values) => updateFilters({ status: values as Ticket['status'][] })}
        />

        {/* Priority Filter */}
        <MultiSelect
          label="Priority"
          options={priorityOptions}
          selectedValues={filters.priority || []}
          onChange={(values) => updateFilters({ priority: values as Ticket['priority'][] })}
        />

        {/* Location Filter */}
        <MultiSelect
          label="Location"
          options={locationOptions}
          selectedValues={filters.location || []}
          onChange={(values) => updateFilters({ location: values as Ticket['location'][] })}
        />

        {/* Form Type Filter */}
        <MultiSelect
          label="Type"
          options={formTypeOptions}
          selectedValues={filters.form_type || []}
          onChange={(values) => updateFilters({ form_type: values as Ticket['form_type'][] })}
        />
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Date Range</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <Input
              type="date"
              value={filters.date_range?.start ? new Date(filters.date_range.start).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const startDate = e.target.value ? new Date(e.target.value) : undefined;
                updateFilters({
                  date_range: startDate || filters.date_range?.end ? {
                    start: startDate,
                    end: filters.date_range?.end
                  } : undefined
                });
              }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <Input
              type="date"
              value={filters.date_range?.end ? new Date(filters.date_range.end).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const endDate = e.target.value ? new Date(e.target.value) : undefined;
                updateFilters({
                  date_range: filters.date_range?.start || endDate ? {
                    start: filters.date_range?.start,
                    end: endDate
                  } : undefined
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Assigned To Filter (for managers/admins) */}
      {authUser && (authUser.role === 'manager' || authUser.role === 'admin') && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Assigned To</label>
          <Select
            value={filters.assigned_to || ''}
            onChange={(e) => updateFilters({ assigned_to: e.target.value || undefined })}
          >
            <option value="">All assignments</option>
            <option value="unassigned">Unassigned</option>
            <option value={authUser.id}>Assigned to me</option>
            {/* TODO: Add other team members */}
          </Select>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {(filters.status || []).map((status) => (
              <Badge
                key={`status-${status}`}
                color="blue"
                size="sm"
                className="gap-1"
              >
                Status: {statusOptions.find(o => o.value === status)?.label}
                <button
                  onClick={() => updateFilters({ 
                    status: filters.status?.filter(s => s !== status) 
                  })}
                  className="ml-1 text-blue-600 hover:text-blue-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(filters.priority || []).map((priority) => (
              <Badge
                key={`priority-${priority}`}
                className="bg-yellow-100 text-yellow-800 gap-1"
                size="sm"
              >
                Priority: {priorityOptions.find(o => o.value === priority)?.label}
                <button
                  onClick={() => updateFilters({ 
                    priority: filters.priority?.filter(p => p !== priority) 
                  })}
                  className="ml-1 text-yellow-600 hover:text-yellow-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(filters.location || []).map((location) => (
              <Badge
                key={`location-${location}`}
                className="bg-green-100 text-green-800 gap-1"
                size="sm"
              >
                Location: {location}
                <button
                  onClick={() => updateFilters({ 
                    location: filters.location?.filter(l => l !== location) 
                  })}
                  className="ml-1 text-green-600 hover:text-green-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
