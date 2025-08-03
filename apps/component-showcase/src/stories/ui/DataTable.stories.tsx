import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '@ganger/ui';
import type { Column } from '@ganger/ui';

const meta: Meta<typeof DataTable> = {
  title: '@ganger/ui/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Data table component with sorting, filtering, and pagination capabilities.',
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
    emptyMessage: {
      control: 'text',
      description: 'Message to show when data is empty',
    },
    sortable: {
      control: 'boolean',
      description: 'Enable column sorting',
    },
    searchable: {
      control: 'boolean',
      description: 'Show search input',
    },
    paginated: {
      control: 'boolean',
      description: 'Enable pagination',
    },
    pageSize: {
      control: 'number',
      description: 'Number of rows per page',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

// Sample data
const sampleData = [
  { id: 1, name: 'John Doe', role: 'Medical Assistant', location: 'Plymouth', status: 'Active', patients: 45 },
  { id: 2, name: 'Jane Smith', role: 'Nurse Practitioner', location: 'Westland', status: 'Active', patients: 62 },
  { id: 3, name: 'Bob Johnson', role: 'Technician', location: 'Plymouth', status: 'Inactive', patients: 0 },
  { id: 4, name: 'Alice Brown', role: 'Physician', location: 'Canton', status: 'Active', patients: 128 },
  { id: 5, name: 'Charlie Davis', role: 'Medical Assistant', location: 'Westland', status: 'Active', patients: 37 },
];

const columns: Column<typeof sampleData[0]>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'location', header: 'Location', sortable: true },
  { key: 'status', header: 'Status', render: (value) => (
    <span className={`px-2 py-1 rounded-full text-xs ${
      value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'
    }`}>
      {value}
    </span>
  )},
  { key: 'patients', header: 'Patients', sortable: true, align: 'right' },
];

export const Default: Story = {
  args: {
    data: sampleData,
    columns: columns,
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
    emptyMessage: 'No staff members found',
  },
};

export const WithSearch: Story = {
  args: {
    data: sampleData,
    columns: columns,
    searchable: true,
  },
};

export const WithPagination: Story = {
  args: {
    data: [...sampleData, ...sampleData, ...sampleData].map((item, index) => ({ ...item, id: index })),
    columns: columns,
    paginated: true,
    pageSize: 5,
  },
};

export const FullFeatured: Story = {
  args: {
    data: [...sampleData, ...sampleData].map((item, index) => ({ ...item, id: index })),
    columns: columns,
    sortable: true,
    searchable: true,
    paginated: true,
    pageSize: 5,
  },
};

export const CustomRendering: Story = {
  args: {
    data: sampleData,
    columns: [
      { 
        key: 'name', 
        header: 'Staff Member',
        render: (value, row) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-medium">
              {value.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <div className="font-medium">{value}</div>
              <div className="text-xs text-neutral-500">{row.role}</div>
            </div>
          </div>
        )
      },
      { key: 'location', header: 'Location' },
      { 
        key: 'patients', 
        header: 'Patient Load',
        render: (value) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-cyan-600 h-2 rounded-full" 
                style={{ width: `${Math.min(value / 150 * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm">{value}</span>
          </div>
        )
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (_, row) => (
          <button className="text-cyan-600 hover:text-cyan-700 text-sm">
            View Details
          </button>
        )
      }
    ],
  },
};

export const CompactTable: Story = {
  args: {
    data: sampleData.slice(0, 3),
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Role' },
      { key: 'status', header: 'Status' },
    ],
    className: 'text-sm',
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