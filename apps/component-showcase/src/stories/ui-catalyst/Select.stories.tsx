import type { Meta, StoryObj } from '@storybook/react';
import { Select, FormField } from '@ganger/ui-catalyst';
import { useState } from 'react';

const meta: Meta<typeof Select> = {
  title: '@ganger/ui-catalyst/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Select dropdown component with modern Catalyst styling.',
      },
    },
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable the select',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Select size',
    },
    value: {
      control: 'text',
      description: 'Controlled value',
    },
    defaultValue: {
      control: 'text',
      description: 'Default value for uncontrolled usage',
    },
    onChange: {
      action: 'changed',
      description: 'Change event handler',
    },
    children: {
      control: false,
      description: 'Option elements',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    children: (
      <>
        <option value="">Choose an option</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </>
    ),
  },
};

export const WithDefaultValue: Story = {
  args: {
    defaultValue: '2',
    children: (
      <>
        <option value="">Choose an option</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '1',
    children: (
      <>
        <option value="">Choose an option</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </>
    ),
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Small</label>
        <Select size="sm">
          <option>Small select</option>
          <option>Option 2</option>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Medium (default)</label>
        <Select size="md">
          <option>Medium select</option>
          <option>Option 2</option>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Large</label>
        <Select size="lg">
          <option>Large select</option>
          <option>Option 2</option>
        </Select>
      </div>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const ControlledDemo = () => {
      const [value, setValue] = useState('');
      
      return (
        <div className="space-y-4">
          <Select 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="">Select a fruit</option>
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
            <option value="orange">Orange</option>
            <option value="grape">Grape</option>
          </Select>
          
          <p className="text-sm text-neutral-600">
            Selected: {value || 'None'}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => setValue('banana')}
              className="px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              Select Banana
            </button>
            <button
              onClick={() => setValue('')}
              className="px-3 py-1 text-sm border rounded hover:bg-neutral-50"
            >
              Clear
            </button>
          </div>
        </div>
      );
    };
    
    return <ControlledDemo />;
  },
};

export const WithFormField: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <FormField label="Country" required>
        <Select>
          <option value="">Select your country</option>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="uk">United Kingdom</option>
          <option value="au">Australia</option>
          <option value="de">Germany</option>
          <option value="fr">France</option>
          <option value="jp">Japan</option>
        </Select>
      </FormField>
      
      <FormField 
        label="State/Province" 
        helpText="Select your state or province"
      >
        <Select defaultValue="ca">
          <option value="">Choose state</option>
          <option value="ca">California</option>
          <option value="tx">Texas</option>
          <option value="ny">New York</option>
          <option value="fl">Florida</option>
        </Select>
      </FormField>
      
      <FormField 
        label="Preferred Language" 
        error="This field is required"
      >
        <Select className="border-red-500">
          <option value="">Select language</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </Select>
      </FormField>
    </div>
  ),
};

export const MedicalForm: Story = {
  render: () => {
    const MedicalFormDemo = () => {
      const [formData, setFormData] = useState({
        appointmentType: '',
        provider: '',
        timeSlot: '',
        reason: '',
      });
      
      const handleChange = (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
      };
      
      return (
        <form className="w-96 space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Schedule Appointment</h3>
          
          <FormField label="Appointment Type" required>
            <Select 
              value={formData.appointmentType}
              onChange={handleChange('appointmentType')}
            >
              <option value="">Select type</option>
              <option value="routine">Routine Check-up</option>
              <option value="followup">Follow-up Visit</option>
              <option value="consultation">New Patient Consultation</option>
              <option value="urgent">Urgent Care</option>
            </Select>
          </FormField>
          
          <FormField label="Provider" required>
            <Select 
              value={formData.provider}
              onChange={handleChange('provider')}
              disabled={!formData.appointmentType}
            >
              <option value="">Select provider</option>
              <option value="dr-smith">Dr. Sarah Smith</option>
              <option value="dr-jones">Dr. Michael Jones</option>
              <option value="dr-brown">Dr. Emily Brown</option>
              <option value="any">Any Available</option>
            </Select>
          </FormField>
          
          <FormField label="Preferred Time" required>
            <Select 
              value={formData.timeSlot}
              onChange={handleChange('timeSlot')}
              disabled={!formData.provider}
            >
              <option value="">Select time slot</option>
              <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
              <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
              <option value="evening">Evening (5:00 PM - 7:00 PM)</option>
            </Select>
          </FormField>
          
          <FormField label="Primary Reason for Visit">
            <Select 
              value={formData.reason}
              onChange={handleChange('reason')}
            >
              <option value="">Select reason (optional)</option>
              <option value="skin-check">Skin Cancer Screening</option>
              <option value="acne">Acne Treatment</option>
              <option value="rash">Rash or Irritation</option>
              <option value="cosmetic">Cosmetic Consultation</option>
              <option value="other">Other</option>
            </Select>
          </FormField>
          
          <button
            type="submit"
            className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
            disabled={!formData.appointmentType || !formData.provider || !formData.timeSlot}
          >
            Schedule Appointment
          </button>
        </form>
      );
    };
    
    return <MedicalFormDemo />;
  },
};

export const GroupedOptions: Story = {
  render: () => (
    <div className="w-80">
      <label className="block text-sm font-medium mb-2">Select Department</label>
      <Select>
        <option value="">Choose department</option>
        <optgroup label="Medical">
          <option value="dermatology">Dermatology</option>
          <option value="internal">Internal Medicine</option>
          <option value="pediatrics">Pediatrics</option>
          <option value="cardiology">Cardiology</option>
        </optgroup>
        <optgroup label="Surgical">
          <option value="general-surgery">General Surgery</option>
          <option value="orthopedics">Orthopedics</option>
          <option value="neurosurgery">Neurosurgery</option>
        </optgroup>
        <optgroup label="Support Services">
          <option value="radiology">Radiology</option>
          <option value="laboratory">Laboratory</option>
          <option value="pharmacy">Pharmacy</option>
        </optgroup>
      </Select>
    </div>
  ),
};

export const LongOptions: Story = {
  render: () => (
    <div className="w-96">
      <label className="block text-sm font-medium mb-2">Medication</label>
      <Select>
        <option value="">Select medication</option>
        <option value="1">Amoxicillin 500mg - Antibiotic for bacterial infections</option>
        <option value="2">Lisinopril 10mg - ACE inhibitor for hypertension</option>
        <option value="3">Metformin 1000mg - Antidiabetic medication</option>
        <option value="4">Atorvastatin 20mg - Statin for cholesterol management</option>
        <option value="5">Omeprazole 40mg - Proton pump inhibitor for GERD</option>
        <option value="6">Sertraline 50mg - SSRI antidepressant</option>
      </Select>
    </div>
  ),
};

export const StatusSelect: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Order Status</label>
        <Select defaultValue="processing">
          <option value="pending">🟡 Pending</option>
          <option value="processing">🔵 Processing</option>
          <option value="shipped">🟣 Shipped</option>
          <option value="delivered">🟢 Delivered</option>
          <option value="cancelled">🔴 Cancelled</option>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Priority Level</label>
        <Select>
          <option value="">Select priority</option>
          <option value="low">⬇️ Low Priority</option>
          <option value="medium">➡️ Medium Priority</option>
          <option value="high">⬆️ High Priority</option>
          <option value="urgent">🚨 Urgent</option>
        </Select>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="p-6 bg-neutral-900 rounded-lg">
      <div className="w-80 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-white">
            Theme Selection
          </label>
          <Select defaultValue="dark">
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
            <option value="system">System Preference</option>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-white">
            Notification Settings
          </label>
          <Select>
            <option value="">Choose setting</option>
            <option value="all">All Notifications</option>
            <option value="important">Important Only</option>
            <option value="none">None</option>
          </Select>
        </div>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="select-required" className="block text-sm font-medium mb-2">
          Required Field <span className="text-red-500">*</span>
        </label>
        <Select id="select-required" aria-required="true">
          <option value="">Choose option</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      </div>
      
      <div>
        <label htmlFor="select-described" className="block text-sm font-medium mb-2">
          Accessible Select
        </label>
        <Select 
          id="select-described" 
          aria-describedby="select-help"
        >
          <option value="">Select value</option>
          <option value="a">Value A</option>
          <option value="b">Value B</option>
        </Select>
        <p id="select-help" className="text-sm text-neutral-600 mt-1">
          This select includes helpful description for screen readers
        </p>
      </div>
    </div>
  ),
};