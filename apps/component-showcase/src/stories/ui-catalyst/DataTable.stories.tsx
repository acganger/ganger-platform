import type { Meta, StoryObj } from '@storybook/react';
import { DataTable, DataTableLegacy } from '@ganger/ui-catalyst';
import type { DataTableColumn } from '@ganger/ui-catalyst';

const meta: Meta<typeof DataTable> = {
  title: '@ganger/ui-catalyst/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Modern Catalyst data table with enhanced styling, sorting, and filtering.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of data to display',
    },
    columns: {
      control: 'object',
      description: 'Column definitions',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    striped: {
      control: 'boolean',
      description: 'Striped rows',
    },
    hoverable: {
      control: 'boolean',
      description: 'Highlight rows on hover',
    },
    compact: {
      control: 'boolean',
      description: 'Compact table style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

// Sample data
const sampleData = [
  { id: 1, name: 'Dr. Sarah Smith', specialty: 'Dermatology', location: 'Plymouth', patients: 145, rating: 4.8 },
  { id: 2, name: 'Dr. John Davis', specialty: 'General Practice', location: 'Westland', patients: 203, rating: 4.6 },
  { id: 3, name: 'Dr. Emily Brown', specialty: 'Pediatrics', location: 'Canton', patients: 178, rating: 4.9 },
  { id: 4, name: 'Dr. Michael Johnson', specialty: 'Internal Medicine', location: 'Plymouth', patients: 167, rating: 4.7 },
  { id: 5, name: 'Dr. Lisa Wilson', specialty: 'Dermatology', location: 'Westland', patients: 134, rating: 4.8 },
];

const columns: DataTableColumn<typeof sampleData[0]>[] = [
  { key: 'name', header: 'Provider', sortable: true },
  { key: 'specialty', header: 'Specialty', sortable: true },
  { key: 'location', header: 'Location', sortable: true },
  { 
    key: 'patients', 
    header: 'Active Patients', 
    sortable: true,
    align: 'right',
    render: (value) => <span className="font-medium">{value}</span>
  },
  { 
    key: 'rating', 
    header: 'Rating', 
    sortable: true,
    align: 'right',
    render: (value) => (
      <div className="flex items-center justify-end gap-1">
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>{value}</span>
      </div>
    )
  },
];

export const Default: Story = {
  args: {
    data: sampleData,
    columns: columns,
  },
};

export const Striped: Story = {
  args: {
    data: sampleData,
    columns: columns,
    striped: true,
  },
};

export const Hoverable: Story = {
  args: {
    data: sampleData,
    columns: columns,
    hoverable: true,
  },
};

export const Compact: Story = {
  args: {
    data: sampleData,
    columns: columns,
    compact: true,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns: columns,
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: columns,
    emptyMessage: 'No providers found',
  },
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst DataTable</h3>
        <DataTable
          data={sampleData.slice(0, 3)}
          columns={columns}
          striped
          hoverable
        />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy DataTable</h3>
        <DataTableLegacy
          data={sampleData.slice(0, 3)}
          columns={columns}
        />
      </div>
    </div>
  ),
};

export const CustomRendering: Story = {
  args: {
    data: sampleData,
    columns: [
      { 
        key: 'name', 
        header: 'Provider',
        render: (value, row) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
              {value.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <div className="font-medium">{value}</div>
              <div className="text-xs text-neutral-500">{row.specialty}</div>
            </div>
          </div>
        )
      },
      { 
        key: 'location', 
        header: 'Location',
        render: (value) => (
          <span className="inline-flex items-center gap-1 text-sm">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {value}
          </span>
        )
      },
      { 
        key: 'patients', 
        header: 'Patient Load',
        render: (value) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-200 rounded-full h-2 max-w-[100px]">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min(value / 250 * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium">{value}</span>
          </div>
        )
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: () => (
          <button className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
            View Profile
          </button>
        )
      }
    ],
  },
};

export const WithPagination: Story = {
  render: () => {
    const extendedData = [...sampleData, ...sampleData, ...sampleData].map((item, index) => ({
      ...item,
      id: index + 1,
      name: `${item.name} ${index > 4 ? `(${Math.floor(index / 5) + 1})` : ''}`,
    }));
    
    return (
      <div>
        <DataTable
          data={extendedData}
          columns={columns}
          striped
          hoverable
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Showing 1-10 of {extendedData.length} results
          </p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border rounded hover:bg-neutral-100">Previous</button>
            <button className="px-3 py-1 border rounded bg-cyan-600 text-white">1</button>
            <button className="px-3 py-1 border rounded hover:bg-neutral-100">2</button>
            <button className="px-3 py-1 border rounded hover:bg-neutral-100">Next</button>
          </div>
        </div>
      </div>
    );
  },
};

export const ResponsiveTable: Story = {
  args: {
    data: sampleData,
    columns: columns,
    className: 'min-w-full',
  },
  decorators: [
    (Story) => (
      <div className="overflow-x-auto">
        <Story />
      </div>
    ),
  ],
};