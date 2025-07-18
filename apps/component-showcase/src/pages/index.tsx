export const dynamic = 'force-dynamic';
// Deployment test Mon Jun 24 12:48:22 EDT 2025
// Vercel monorepo deployment test - June 24, 2025 17:59

import React, { useState } from 'react';
import Head from 'next/head';
import { 
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  Input,
  Select,
  Checkbox,
  Switch,
  Badge,
  Avatar,
  LoadingSpinner,
  DataTable,
  Modal,
  FormField,
  StatCard,
  PageHeader,
  useTheme,
  colors,
  GangerLogo,
  Alert,
  Progress,
  Toast,
  ToastProvider,
  useToast,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@ganger/ui';

// Import Catalyst components for comparison
import { 
  Progress as CatalystProgress, 
  Alert as CatalystAlert, 
  Badge as CatalystBadge, 
  LoadingSpinner as CatalystLoadingSpinner, 
  Switch as CatalystSwitch, 
  Avatar as CatalystAvatar, 
  Checkbox as CatalystCheckbox, 
  Input as CatalystInput, 
  Select as CatalystSelect, 
  Card as CatalystCard, 
  CardHeader as CatalystCardHeader, 
  CardTitle as CatalystCardTitle, 
  CardDescription as CatalystCardDescription, 
  CardContent as CatalystCardContent, 
  CardFooter as CatalystCardFooter, 
  Modal as CatalystModal, 
  ModalHeader as CatalystModalHeader, 
  ModalContent as CatalystModalContent, 
  ModalFooter as CatalystModalFooter, 
  DataTable as CatalystDataTable,
  Toast as CatalystToast,
  ToastProvider as CatalystToastProvider,
  useToast as useCatalystToast,
  Tabs as CatalystTabs,
  TabsList as CatalystTabsList,
  TabsTrigger as CatalystTabsTrigger,
  TabsContent as CatalystTabsContent,
  StatCard as CatalystStatCard,
  PageHeader as CatalystPageHeader,
  FormField as CatalystFormField
} from '@ganger/ui-catalyst';

// Sample data for DataTable
const sampleData = [
  { id: 1, name: 'John Doe', role: 'Medical Assistant', location: 'Plymouth', status: 'Active' },
  { id: 2, name: 'Jane Smith', role: 'Nurse', location: 'Westland', status: 'Active' },
  { id: 3, name: 'Bob Johnson', role: 'Technician', location: 'Plymouth', status: 'Inactive' },
];

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'role', header: 'Role' },
  { key: 'location', header: 'Location' },
  { key: 'status', header: 'Status' },
];

const ComponentDemo: React.FC<{ title: string; children: React.ReactNode; code?: string }> = ({ 
  title, 
  children, 
  code 
}) => (
  <div className="component-demo">
    <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-neutral-100">{title}</h3>
    <div className="mb-4">
      {children}
    </div>
    {code && (
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          View Code
        </summary>
        <pre className="code-block text-xs">{code}</pre>
      </details>
    )}
  </div>
);

const ColorSwatch: React.FC<{ name: string; colors: any; prefix?: string }> = ({ name, colors, prefix = '' }) => (
  <div className="mb-6">
    <h4 className="text-md font-medium mb-3 text-neutral-900 dark:text-neutral-100">{name}</h4>
    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
      {Object.entries(colors).map(([key, value]) => (
        <div key={key} className="text-center">
          <div 
            className="w-12 h-12 rounded-md border border-neutral-200 dark:border-neutral-700 mb-1"
            style={{ backgroundColor: value as string }}
            title={`${prefix}${key}: ${value}`}
          />
          <div className="text-xs text-neutral-600 dark:text-neutral-400">{key}</div>
        </div>
      ))}
    </div>
  </div>
);

// Toast Demo Component
const ToastDemo = () => {
  const { addToast } = useToast();
  
  return (
    <div className="space-y-3">
      <Button 
        variant="primary" 
        onClick={() => addToast({ title: "Success!", message: "Operation completed successfully", type: "success" })}
      >
        Show Success Toast
      </Button>
      <Button 
        variant="secondary" 
        onClick={() => addToast({ title: "Info", message: "Here's some information for you", type: "info" })}
      >
        Show Info Toast
      </Button>
      <Button 
        variant="outline" 
        onClick={() => addToast({ title: "Warning", message: "Please be careful with this action", type: "warning" })}
      >
        Show Warning Toast
      </Button>
      <Button 
        variant="destructive" 
        onClick={() => addToast({ title: "Error", message: "Something went wrong", type: "error" })}
      >
        Show Error Toast
      </Button>
    </div>
  );
};

export default function ComponentShowcase() {
  const { theme, setTheme, actualTheme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  
  // Catalyst Switch demo states
  const [catalystSwitch1, setCatalystSwitch1] = useState(false);
  const [catalystSwitch2, setCatalystSwitch2] = useState(true);
  const [catalystSwitch3, setCatalystSwitch3] = useState(false);
  const [catalystSwitch4, setCatalystSwitch4] = useState(true);

  // Catalyst Checkbox demo states
  const [catalystCheckbox1, setCatalystCheckbox1] = useState(false);
  const [catalystCheckbox2, setCatalystCheckbox2] = useState(true);
  const [catalystCheckbox3, setCatalystCheckbox3] = useState(false);
  const [catalystCheckbox4, setCatalystCheckbox4] = useState(true);
  const [catalystCheckbox5, setCatalystCheckbox5] = useState(false);

  // Catalyst Input demo states
  const [catalystInput1, setCatalystInput1] = useState('');
  const [catalystInput2, setCatalystInput2] = useState('patient@example.com');
  const [catalystInput3, setCatalystInput3] = useState('');

  // Catalyst Select demo states
  const [catalystSelect1, setCatalystSelect1] = useState('');
  const [catalystSelect2, setCatalystSelect2] = useState('ma');
  const [catalystSelect3, setCatalystSelect3] = useState('');

  // Catalyst Modal demo states
  const [catalystModal1, setCatalystModal1] = useState(false);
  const [catalystModal2, setCatalystModal2] = useState(false);
  const [catalystModal3, setCatalystModal3] = useState(false);

  return (
    <ToastProvider>
      <Head>
        <title>Ganger Platform - Component Showcase</title>
        <meta name="description" content="Visual showcase of all UI components across Ganger Platform applications" />
      </Head>

      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <PageHeader
          title="Component Showcase"
          subtitle="Visual catalog of all UI components used across Ganger Platform applications"
          actions={
            <div className="flex items-center space-x-4">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Current: {actualTheme}
              </div>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Branding */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Branding</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Logo Variants"
                code={`<GangerLogo size="sm" variant="full" />
<GangerLogo size="md" variant="icon" />
<GangerLogo size="lg" variant="full" />
<GangerLogo size="xl" variant="full" />`}
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <GangerLogo size="sm" variant="full" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Small Full Logo</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <GangerLogo size="md" variant="icon" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Medium Icon Only</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <GangerLogo size="lg" variant="full" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Large Full Logo</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <GangerLogo size="xl" variant="full" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Extra Large Full Logo</span>
                  </div>
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Color Tokens */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Color System</h2>
            <div className="component-demo">
              <ColorSwatch name="Primary (Brand Blue)" colors={colors.primary} prefix="primary-" />
              <ColorSwatch name="Secondary (Brand Green)" colors={colors.secondary} prefix="secondary-" />
              <ColorSwatch name="Accent (Brand Purple)" colors={colors.accent} prefix="accent-" />
              <ColorSwatch name="Neutral (Grays)" colors={colors.neutral} prefix="neutral-" />
              
              <h4 className="text-md font-medium mb-3 text-neutral-900 dark:text-neutral-100">Semantic Colors</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries({
                  success: colors.success[500],
                  warning: colors.warning[500],
                  error: colors.error[500],
                  info: colors.info[500],
                }).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-2 mx-auto"
                      style={{ backgroundColor: value }}
                    />
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{key}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{value}</div>
                  </div>
                ))}
              </div>

              <h4 className="text-md font-medium mb-3 text-neutral-900 dark:text-neutral-100">Application-Specific Colors</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Medical Status</h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(colors.medical).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: value }} />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Inventory Status</h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(colors.inventory).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: value }} />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">EOS L10 Theme</h5>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(colors.eos).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="w-10 h-10 rounded-md border border-neutral-200 dark:border-neutral-700 mb-1" style={{ backgroundColor: value }} />
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Buttons */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Buttons</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Button Variants"
                code={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>`}
              >
                <div className="space-y-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Button Sizes"
                code={`<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`}
              >
                <div className="space-y-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Button States"
                code={`<Button loading>Loading</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>`}
              >
                <div className="space-y-3">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Buttons with Icons"
                code={`<Button leftIcon={<span>🔍</span>}>Search</Button>
<Button rightIcon={<span>→</span>}>Continue</Button>`}
              >
                <div className="space-y-3">
                  <Button leftIcon={<span>🔍</span>}>Search</Button>
                  <Button rightIcon={<span>→</span>}>Continue</Button>
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Form Elements */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Form Elements</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Input Field"
                code={`<Input 
  placeholder="Enter text"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
/>`}
              >
                <Input 
                  placeholder="Enter text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </ComponentDemo>

              <ComponentDemo 
                title="Input - Catalyst UI ✨"
                code={`<CatalystInput
  label="Patient Name"
  placeholder="Enter patient name"
  value={catalystInput1}
  onChange={(e) => setCatalystInput1(e.target.value)}
/>
<CatalystInput
  type="email"
  label="Email Address"
  value={catalystInput2}
  onChange={(e) => setCatalystInput2(e.target.value)}
  helper="Used for appointment confirmations"
/>
<CatalystInput
  label="Medical Record Number"
  placeholder="MRN-000000"
  error="Invalid format. Please use MRN-XXXXXX format."
  invalid={true}
/>

// Medical form examples
<CatalystInput type="date" label="Date of Birth" />
<CatalystInput type="tel" label="Phone Number" placeholder="(555) 123-4567" />
<CatalystInput type="number" label="Weight (lbs)" placeholder="150" />`}
              >
                <div className="space-y-6">
                  {/* Basic inputs */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Basic Input Fields</h4>
                    <div className="space-y-4">
                      <CatalystInput
                        label="Patient Name"
                        placeholder="Enter patient name"
                        value={catalystInput1}
                        onChange={(e) => setCatalystInput1(e.target.value)}
                      />
                      <CatalystInput
                        type="email"
                        label="Email Address"
                        value={catalystInput2}
                        onChange={(e) => setCatalystInput2(e.target.value)}
                        helper="Used for appointment confirmations and reminders"
                      />
                      <CatalystInput
                        type="tel"
                        label="Phone Number"
                        placeholder="(555) 123-4567"
                        value={catalystInput3}
                        onChange={(e) => setCatalystInput3(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Input states */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Input States</h4>
                    <div className="space-y-4">
                      <CatalystInput
                        label="Medical Record Number"
                        placeholder="MRN-000000"
                        error="Invalid format. Please use MRN-XXXXXX format."
                        invalid={true}
                      />
                      <CatalystInput
                        label="Disabled Field"
                        value="Read-only value"
                        disabled={true}
                        helper="This field cannot be edited"
                      />
                      <CatalystInput
                        label="Required Field"
                        placeholder="This field is required"
                        required={true}
                      />
                    </div>
                  </div>

                  {/* Medical input types */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Medical Form Fields</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CatalystInput
                        type="date"
                        label="Date of Birth"
                      />
                      <CatalystInput
                        type="number"
                        label="Weight (lbs)"
                        placeholder="150"
                      />
                      <CatalystInput
                        type="time"
                        label="Appointment Time"
                      />
                      <CatalystInput
                        type="text"
                        label="Insurance ID"
                        placeholder="INS-123456789"
                      />
                    </div>
                  </div>

                  {/* Medical workflow example */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Patient Registration Form</h4>
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg space-y-4">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        New Patient Registration
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CatalystInput
                          label="First Name"
                          placeholder="John"
                          required
                        />
                        <CatalystInput
                          label="Last Name"
                          placeholder="Doe"
                          required
                        />
                        <CatalystInput
                          type="date"
                          label="Date of Birth"
                          required
                        />
                        <CatalystInput
                          label="Social Security Number"
                          placeholder="XXX-XX-XXXX"
                          type="text"
                        />
                        <CatalystInput
                          type="email"
                          label="Email"
                          placeholder="john.doe@email.com"
                        />
                        <CatalystInput
                          type="tel"
                          label="Primary Phone"
                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>
                      <CatalystInput
                        label="Address"
                        placeholder="123 Main Street, City, State 12345"
                      />
                      <CatalystInput
                        label="Emergency Contact"
                        placeholder="Jane Doe - (555) 987-6543"
                        helper="Name and phone number of emergency contact"
                      />
                    </div>
                  </div>

                  {/* Search and special inputs */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Search and Special Inputs</h4>
                    <div className="space-y-4">
                      <CatalystInput
                        type="search"
                        placeholder="Search patients by name or MRN..."
                        helper="Type to search patient records"
                      />
                      <CatalystInput
                        type="password"
                        label="Secure Access Code"
                        placeholder="Enter access code"
                      />
                      <CatalystInput
                        type="url"
                        label="Insurance Portal URL"
                        placeholder="https://insurance.example.com"
                      />
                    </div>
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Select Dropdown"
                code={`<Select
  value={selectValue}
  onChange={(e) => setSelectValue(e.target.value)}
  placeholder="Choose option"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]}
/>`}
              >
                <Select
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  placeholder="Choose option"
                  options={[
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                    { value: 'option3', label: 'Option 3' },
                  ]}
                />
              </ComponentDemo>

              <ComponentDemo 
                title="Select - Catalyst UI ✨"
                code={`<CatalystSelect
  label="Provider Type"
  value={catalystSelect1}
  onChange={(e) => setCatalystSelect1(e.target.value)}
>
  <option value="">Select a provider...</option>
  <optgroup label="Physicians">
    <option value="md">MD - Medical Doctor</option>
    <option value="do">DO - Doctor of Osteopathy</option>
  </optgroup>
  <optgroup label="Advanced Practice">
    <option value="np">NP - Nurse Practitioner</option>
    <option value="pa">PA - Physician Assistant</option>
  </optgroup>
  <optgroup label="Support Staff">
    <option value="rn">RN - Registered Nurse</option>
    <option value="ma">MA - Medical Assistant</option>
  </optgroup>
</CatalystSelect>

<CatalystSelect
  label="Appointment Type"
  value={catalystSelect2}
  onChange={(e) => setCatalystSelect2(e.target.value)}
  helper="Select the type of appointment needed"
>
  <option value="">Choose appointment type...</option>
  <option value="new">New Patient Consultation</option>
  <option value="followup">Follow-up Visit</option>
  <option value="annual">Annual Checkup</option>
  <option value="urgent">Urgent Care</option>
  <option value="lab">Lab Work Only</option>
</CatalystSelect>

<CatalystSelect
  label="Insurance Provider"
  error="Please select an insurance provider"
  invalid={true}
>
  <option value="">Select insurance...</option>
  <option value="bcbs">Blue Cross Blue Shield</option>
  <option value="aetna">Aetna</option>
  <option value="cigna">Cigna</option>
  <option value="united">United Healthcare</option>
  <option value="medicare">Medicare</option>
  <option value="medicaid">Medicaid</option>
  <option value="self">Self Pay</option>
</CatalystSelect>`}
              >
                <div className="space-y-6">
                  {/* Basic selects */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Medical Forms</h4>
                    <div className="space-y-4">
                      <CatalystSelect
                        label="Provider Type"
                        value={catalystSelect1}
                        onChange={(e) => setCatalystSelect1(e.target.value)}
                      >
                        <option value="">Select a provider...</option>
                        <optgroup label="Physicians">
                          <option value="md">MD - Medical Doctor</option>
                          <option value="do">DO - Doctor of Osteopathy</option>
                        </optgroup>
                        <optgroup label="Advanced Practice">
                          <option value="np">NP - Nurse Practitioner</option>
                          <option value="pa">PA - Physician Assistant</option>
                        </optgroup>
                        <optgroup label="Support Staff">
                          <option value="rn">RN - Registered Nurse</option>
                          <option value="ma">MA - Medical Assistant</option>
                        </optgroup>
                      </CatalystSelect>

                      <CatalystSelect
                        label="Appointment Type"
                        value={catalystSelect2}
                        onChange={(e) => setCatalystSelect2(e.target.value)}
                        helper="Select the type of appointment needed"
                      >
                        <option value="">Choose appointment type...</option>
                        <option value="new">New Patient Consultation</option>
                        <option value="followup">Follow-up Visit</option>
                        <option value="annual">Annual Checkup</option>
                        <option value="urgent">Urgent Care</option>
                        <option value="lab">Lab Work Only</option>
                      </CatalystSelect>

                      <CatalystSelect
                        label="Visit Location"
                        value={catalystSelect3}
                        onChange={(e) => setCatalystSelect3(e.target.value)}
                      >
                        <option value="">Choose location...</option>
                        <option value="plymouth">Plymouth Main Office</option>
                        <option value="westland">Westland Clinic</option>
                        <option value="telehealth">Telehealth (Virtual)</option>
                      </CatalystSelect>
                    </div>
                  </div>

                  {/* Select states */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Select States</h4>
                    <div className="space-y-4">
                      <CatalystSelect
                        label="Insurance Provider"
                        error="Please select an insurance provider"
                        invalid={true}
                      >
                        <option value="">Select insurance...</option>
                        <option value="bcbs">Blue Cross Blue Shield</option>
                        <option value="aetna">Aetna</option>
                        <option value="cigna">Cigna</option>
                        <option value="united">United Healthcare</option>
                        <option value="medicare">Medicare</option>
                        <option value="medicaid">Medicaid</option>
                        <option value="self">Self Pay</option>
                      </CatalystSelect>

                      <CatalystSelect
                        label="Disabled Select"
                        value="fixed"
                        disabled={true}
                        helper="This selection cannot be changed"
                      >
                        <option value="fixed">Fixed Selection</option>
                      </CatalystSelect>

                      <CatalystSelect
                        label="Multi-Select Example"
                        multiple={true}
                        helper="Hold Ctrl/Cmd to select multiple options"
                      >
                        <optgroup label="Symptoms">
                          <option value="fever">Fever</option>
                          <option value="cough">Cough</option>
                          <option value="fatigue">Fatigue</option>
                          <option value="headache">Headache</option>
                        </optgroup>
                        <optgroup label="Duration">
                          <option value="recent">Less than 3 days</option>
                          <option value="week">3-7 days</option>
                          <option value="chronic">More than 7 days</option>
                        </optgroup>
                      </CatalystSelect>
                    </div>
                  </div>

                  {/* Medical workflow example */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Patient Intake Form</h4>
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg space-y-4">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Schedule New Appointment
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CatalystSelect
                          label="Department"
                          required
                        >
                          <option value="">Select department...</option>
                          <option value="derm">Dermatology</option>
                          <option value="primary">Primary Care</option>
                          <option value="cardio">Cardiology</option>
                          <option value="ortho">Orthopedics</option>
                        </CatalystSelect>
                        <CatalystSelect
                          label="Urgency"
                          required
                        >
                          <option value="">Select urgency...</option>
                          <option value="routine">Routine (2-4 weeks)</option>
                          <option value="soon">Soon (1 week)</option>
                          <option value="urgent">Urgent (1-2 days)</option>
                          <option value="emergency">Emergency (Today)</option>
                        </CatalystSelect>
                        <CatalystSelect
                          label="Preferred Time"
                        >
                          <option value="">No preference</option>
                          <option value="morning">Morning (8am-12pm)</option>
                          <option value="afternoon">Afternoon (12pm-5pm)</option>
                          <option value="evening">Evening (5pm-8pm)</option>
                        </CatalystSelect>
                        <CatalystSelect
                          label="Language Preference"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="ar">Arabic</option>
                          <option value="zh">Chinese</option>
                        </CatalystSelect>
                      </div>
                    </div>
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Checkbox"
                code={`<Checkbox
  checked={checkboxValue}
  onChange={(e) => setCheckboxValue(e.target.checked)}
  label="Accept terms and conditions"
/>`}
              >
                <Checkbox
                  checked={checkboxValue}
                  onChange={(e) => setCheckboxValue(e.target.checked)}
                  label="Accept terms and conditions"
                />
              </ComponentDemo>

              <ComponentDemo 
                title="Checkbox - Catalyst UI ✨"
                code={`<CatalystCheckbox
  checked={catalystCheckbox1}
  onChange={setCatalystCheckbox1}
  label="Enable HIPAA compliance mode"
  color="blue"
/>
<CatalystCheckbox
  checked={catalystCheckbox2}
  onChange={setCatalystCheckbox2}
  label="Send appointment reminders"
  description="Automatically send SMS reminders 24 hours before appointments"
  color="green"
/>
<CatalystCheckbox
  checked={catalystCheckbox3}
  onChange={setCatalystCheckbox3}
  indeterminate={true}
  label="Emergency alerts"
  color="red"
/>

// Medical workflow examples
<CatalystCheckbox label="Patient consent" color="emerald" />
<CatalystCheckbox label="Insurance verified" color="blue" />
<CatalystCheckbox label="Lab results reviewed" color="purple" />`}
              >
                <div className="space-y-6">
                  {/* Basic checkbox states */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Basic States</h4>
                    <div className="space-y-4">
                      <CatalystCheckbox
                        checked={catalystCheckbox1}
                        onChange={setCatalystCheckbox1}
                        label="Enable HIPAA compliance mode"
                        color="blue"
                      />
                      <CatalystCheckbox
                        checked={catalystCheckbox2}
                        onChange={setCatalystCheckbox2}
                        label="Send appointment reminders"
                        description="Automatically send SMS reminders 24 hours before appointments"
                        color="green"
                      />
                      <CatalystCheckbox
                        checked={catalystCheckbox3}
                        onChange={setCatalystCheckbox3}
                        indeterminate={true}
                        label="Emergency alerts (indeterminate)"
                        description="Some emergency alert types are enabled"
                        color="red"
                      />
                      <CatalystCheckbox
                        checked={false}
                        disabled={true}
                        label="Disabled option"
                        description="This option is not available in your plan"
                        color="zinc"
                      />
                    </div>
                  </div>

                  {/* Color variants */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Medical Color Contexts</h4>
                    <div className="space-y-3">
                      <CatalystCheckbox
                        checked={true}
                        label="Patient consent obtained"
                        color="emerald"
                      />
                      <CatalystCheckbox
                        checked={true}
                        label="Insurance verification complete"
                        color="blue"
                      />
                      <CatalystCheckbox
                        checked={false}
                        label="Lab results reviewed"
                        color="purple"
                      />
                      <CatalystCheckbox
                        checked={true}
                        label="Emergency contact verified"
                        color="orange"
                      />
                      <CatalystCheckbox
                        checked={false}
                        label="High priority case"
                        color="red"
                      />
                      <CatalystCheckbox
                        checked={true}
                        label="Follow-up scheduled"
                        color="teal"
                      />
                    </div>
                  </div>

                  {/* Interactive workflow example */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Medical Workflow Checklist</h4>
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Pre-Appointment Checklist for John Doe
                      </div>
                      <CatalystCheckbox
                        checked={catalystCheckbox4}
                        onChange={setCatalystCheckbox4}
                        label="Patient registration verified"
                        color="blue"
                      />
                      <CatalystCheckbox
                        checked={catalystCheckbox5}
                        onChange={setCatalystCheckbox5}
                        label="Insurance authorization obtained"
                        description="Required for dermatology procedures"
                        color="green"
                      />
                      <CatalystCheckbox
                        checked={false}
                        label="Medical history reviewed"
                        color="purple"
                      />
                      <CatalystCheckbox
                        checked={false}
                        label="Consent forms signed"
                        color="emerald"
                      />
                      <CatalystCheckbox
                        checked={false}
                        label="Room prepared"
                        color="orange"
                      />
                    </div>
                  </div>

                  {/* Color showcase */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">All Color Variants</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <CatalystCheckbox checked={true} label="Zinc" color="zinc" />
                      <CatalystCheckbox checked={true} label="Red" color="red" />
                      <CatalystCheckbox checked={true} label="Orange" color="orange" />
                      <CatalystCheckbox checked={true} label="Amber" color="amber" />
                      <CatalystCheckbox checked={true} label="Yellow" color="yellow" />
                      <CatalystCheckbox checked={true} label="Lime" color="lime" />
                      <CatalystCheckbox checked={true} label="Green" color="green" />
                      <CatalystCheckbox checked={true} label="Emerald" color="emerald" />
                      <CatalystCheckbox checked={true} label="Teal" color="teal" />
                      <CatalystCheckbox checked={true} label="Cyan" color="cyan" />
                      <CatalystCheckbox checked={true} label="Sky" color="sky" />
                      <CatalystCheckbox checked={true} label="Blue" color="blue" />
                      <CatalystCheckbox checked={true} label="Indigo" color="indigo" />
                      <CatalystCheckbox checked={true} label="Violet" color="violet" />
                      <CatalystCheckbox checked={true} label="Purple" color="purple" />
                      <CatalystCheckbox checked={true} label="Fuchsia" color="fuchsia" />
                      <CatalystCheckbox checked={true} label="Pink" color="pink" />
                      <CatalystCheckbox checked={true} label="Rose" color="rose" />
                    </div>
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Switch"
                code={`<Switch
  checked={switchValue}
  onChange={setSwitchValue}
/>`}
              >
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={switchValue}
                    onChange={setSwitchValue}
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Enable notifications</span>
                </div>
              </ComponentDemo>

              {/* Catalyst Switch Component */}
              <ComponentDemo 
                title="🎨 Catalyst Switch (New Design System)"
                code={`<CatalystSwitch
  checked={catalystSwitch1}
  onChange={setCatalystSwitch1}
  color="blue"
/>
<CatalystSwitch
  checked={catalystSwitch2}
  onChange={setCatalystSwitch2}
  color="green"
/>
<CatalystSwitch
  checked={catalystSwitch3}
  onChange={setCatalystSwitch3}
  color="red"
/>`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Enable notifications</span>
                    <CatalystSwitch
                      checked={catalystSwitch1}
                      onChange={setCatalystSwitch1}
                      color="blue"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Auto-save drafts</span>
                    <CatalystSwitch
                      checked={catalystSwitch2}
                      onChange={setCatalystSwitch2}
                      color="green"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Emergency alerts</span>
                    <CatalystSwitch
                      checked={catalystSwitch3}
                      onChange={setCatalystSwitch3}
                      color="red"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">HIPAA compliance mode</span>
                    <CatalystSwitch
                      checked={catalystSwitch4}
                      onChange={setCatalystSwitch4}
                      color="purple"
                    />
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Catalyst Switch Sizes & Colors"
                code={`<CatalystSwitch size="sm" color="emerald" />
<CatalystSwitch size="md" color="amber" />
<CatalystSwitch size="lg" color="violet" />`}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 w-12">Small:</span>
                    <CatalystSwitch size="sm" checked={true} onChange={() => {}} color="emerald" />
                    <CatalystSwitch size="sm" checked={false} onChange={() => {}} color="emerald" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 w-12">Medium:</span>
                    <CatalystSwitch size="md" checked={true} onChange={() => {}} color="amber" />
                    <CatalystSwitch size="md" checked={false} onChange={() => {}} color="amber" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg text-neutral-600 dark:text-neutral-400 w-12">Large:</span>
                    <CatalystSwitch size="lg" checked={true} onChange={() => {}} color="violet" />
                    <CatalystSwitch size="lg" checked={false} onChange={() => {}} color="violet" />
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Form Field with Validation"
                code={`<FormField
  label="Email Address"
  required
  error="Please enter a valid email"
>
  <Input type="email" placeholder="user@example.com" />
</FormField>`}
              >
                <FormField
                  label="Email Address"
                  required
                  error="Please enter a valid email"
                >
                  <Input type="email" placeholder="user@example.com" />
                </FormField>
              </ComponentDemo>
            </div>
          </section>

          {/* Cards and Layout */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Cards & Layout</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Basic Card"
                code={`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button size="sm">Action</Button>
  </CardFooter>
</Card>`}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Card content goes here.</p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Action</Button>
                  </CardFooter>
                </Card>
              </ComponentDemo>

              <ComponentDemo 
                title="Stat Card"
                code={`<StatCard
  title="Total Patients"
  value="1,234"
  trend={{ value: 12.5, direction: 'up' }}
  variant="success"
/>`}
              >
                <StatCard
                  title="Total Patients"
                  value="1,234"
                  trend={{ value: 12.5, direction: 'up' }}
                  variant="success"
                />
              </ComponentDemo>

              <ComponentDemo 
                title="Card - Catalyst UI ✨"
                code={`<CatalystCard>
  <CatalystCardHeader>
    <CatalystCardTitle>Patient Information</CatalystCardTitle>
    <CatalystCardDescription>View and manage patient details</CatalystCardDescription>
  </CatalystCardHeader>
  <CatalystCardContent>
    <p>John Doe - MRN: 123456</p>
    <p>DOB: 01/15/1980</p>
    <p>Last Visit: 12/20/2024</p>
  </CatalystCardContent>
  <CatalystCardFooter>
    <Button size="sm" variant="primary">View Details</Button>
    <Button size="sm" variant="outline">Edit</Button>
  </CatalystCardFooter>
</CatalystCard>

// Interactive Card
<CatalystCard interactive onClick={() => alert('Card clicked!')}>
  <CatalystCardHeader>
    <CatalystCardTitle size="sm">Click me!</CatalystCardTitle>
    <CatalystCardDescription>This card is interactive</CatalystCardDescription>
  </CatalystCardHeader>
</CatalystCard>

// Different padding and rounded options
<CatalystCard padding="sm" rounded="lg">
  <CatalystCardHeader border>
    <CatalystCardTitle>Appointment Card</CatalystCardTitle>
  </CatalystCardHeader>
  <CatalystCardContent>
    Tomorrow at 2:00 PM
  </CatalystCardContent>
  <CatalystCardFooter border>
    <Button size="sm">Confirm</Button>
  </CatalystCardFooter>
</CatalystCard>`}
              >
                <div className="space-y-6">
                  {/* Basic Card */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Basic Card</h4>
                    <CatalystCard>
                      <CatalystCardHeader>
                        <CatalystCardTitle>Patient Information</CatalystCardTitle>
                        <CatalystCardDescription>View and manage patient details</CatalystCardDescription>
                      </CatalystCardHeader>
                      <CatalystCardContent>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Name:</span> John Doe</p>
                          <p><span className="font-medium">MRN:</span> 123456</p>
                          <p><span className="font-medium">DOB:</span> 01/15/1980</p>
                          <p><span className="font-medium">Last Visit:</span> 12/20/2024</p>
                        </div>
                      </CatalystCardContent>
                      <CatalystCardFooter>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary">View Details</Button>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </CatalystCardFooter>
                    </CatalystCard>
                  </div>

                  {/* Interactive Cards */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Interactive Cards</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CatalystCard interactive onClick={() => alert('Appointment selected!')}>
                        <CatalystCardHeader>
                          <CatalystCardTitle size="sm">Dr. Sarah Johnson</CatalystCardTitle>
                          <CatalystCardDescription>Tomorrow at 2:00 PM</CatalystCardDescription>
                        </CatalystCardHeader>
                        <CatalystCardContent>
                          <p className="text-sm">Annual checkup</p>
                          <p className="text-xs text-zinc-500 mt-1">Click to view details</p>
                        </CatalystCardContent>
                      </CatalystCard>

                      <CatalystCard interactive onClick={() => alert('Lab results viewed!')}>
                        <CatalystCardHeader>
                          <CatalystCardTitle size="sm">Lab Results Ready</CatalystCardTitle>
                          <CatalystCardDescription>Blood work from 12/15/2024</CatalystCardDescription>
                        </CatalystCardHeader>
                        <CatalystCardContent>
                          <p className="text-sm font-medium text-green-600">All results normal</p>
                          <p className="text-xs text-zinc-500 mt-1">Click to view full report</p>
                        </CatalystCardContent>
                      </CatalystCard>
                    </div>
                  </div>

                  {/* Card Variations */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Card Variations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CatalystCard padding="sm" rounded="sm">
                        <CatalystCardHeader>
                          <CatalystCardTitle size="sm">Small Padding</CatalystCardTitle>
                        </CatalystCardHeader>
                        <CatalystCardContent>
                          <p className="text-sm">Compact card design</p>
                        </CatalystCardContent>
                      </CatalystCard>

                      <CatalystCard padding="md" rounded="lg">
                        <CatalystCardHeader border>
                          <CatalystCardTitle size="sm">With Header Border</CatalystCardTitle>
                        </CatalystCardHeader>
                        <CatalystCardContent>
                          <p className="text-sm">Separated sections</p>
                        </CatalystCardContent>
                        <CatalystCardFooter border>
                          <Button size="sm">Action</Button>
                        </CatalystCardFooter>
                      </CatalystCard>

                      <CatalystCard padding="lg" rounded="xl">
                        <CatalystCardHeader>
                          <CatalystCardTitle size="lg">Large Card</CatalystCardTitle>
                          <CatalystCardDescription>Extra spacing and large radius</CatalystCardDescription>
                        </CatalystCardHeader>
                        <CatalystCardContent>
                          <p className="text-sm">Spacious design</p>
                        </CatalystCardContent>
                      </CatalystCard>
                    </div>
                  </div>

                  {/* Medical Workflow Card */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Medical Workflow Example</h4>
                    <CatalystCard>
                      <CatalystCardHeader border>
                        <CatalystCardTitle>Patient Visit Summary</CatalystCardTitle>
                        <CatalystCardDescription>December 20, 2024 - Dr. Emily Chen</CatalystCardDescription>
                      </CatalystCardHeader>
                      <CatalystCardContent>
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Chief Complaint</h5>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Annual skin check</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-1">Findings</h5>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">No suspicious lesions identified. Mild actinic damage noted.</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-1">Recommendations</h5>
                            <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                              <li>Continue daily sunscreen use</li>
                              <li>Follow up in 12 months</li>
                              <li>Monitor any new or changing moles</li>
                            </ul>
                          </div>
                        </div>
                      </CatalystCardContent>
                      <CatalystCardFooter border>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-sm text-zinc-500">Signed by Dr. Emily Chen</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Print</Button>
                            <Button size="sm" variant="primary">Send to Patient</Button>
                          </div>
                        </div>
                      </CatalystCardFooter>
                    </CatalystCard>
                  </div>

                  {/* Disabled Card */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Disabled State</h4>
                    <CatalystCard interactive disabled>
                      <CatalystCardHeader>
                        <CatalystCardTitle size="sm">Unavailable Appointment Slot</CatalystCardTitle>
                        <CatalystCardDescription>This time slot is no longer available</CatalystCardDescription>
                      </CatalystCardHeader>
                    </CatalystCard>
                  </div>
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Data Display */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Data Display</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Badges"
                code={`<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Avatar"
                code={`<Avatar alt="John Doe" size="sm" />
<Avatar initials="JS" size="md" />
<Avatar initials="BJ" size="lg" />`}
              >
                <div className="flex items-center space-x-4">
                  <Avatar
                    alt="John Doe"
                    size="sm"
                  />
                  <Avatar initials="JS" size="md" />
                  <Avatar initials="BJ" size="lg" />
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Avatar - Catalyst UI ✨"
                code={`<CatalystAvatar alt="Dr. Sarah Johnson" size="sm" />
<CatalystAvatar initials="JS" size="md" color="blue" />
<CatalystAvatar initials="AG" size="lg" color="green" />
<CatalystAvatar src="/profile.jpg" size="xl" alt="Dr. Mike Chen" />
<CatalystAvatar initials="RN" size="sm" color="purple" square />

// Medical Context Examples
<CatalystAvatar initials="DR" size="md" color="emerald" alt="Doctor" />
<CatalystAvatar initials="RN" size="md" color="blue" alt="Nurse" />
<CatalystAvatar initials="MA" size="md" color="orange" alt="Medical Assistant" />
<CatalystAvatar initials="PT" size="md" color="purple" alt="Patient" />`}
              >
                <div className="space-y-6">
                  {/* Basic sizes */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Sizes</h4>
                    <div className="flex items-center space-x-4">
                      <CatalystAvatar alt="Small Avatar" initials="XS" size="xs" />
                      <CatalystAvatar alt="Small Avatar" initials="SM" size="sm" />
                      <CatalystAvatar alt="Medium Avatar" initials="MD" size="md" />
                      <CatalystAvatar alt="Large Avatar" initials="LG" size="lg" />
                      <CatalystAvatar alt="Extra Large Avatar" initials="XL" size="xl" />
                      <CatalystAvatar alt="2X Large Avatar" initials="2X" size="2xl" />
                    </div>
                  </div>

                  {/* Color variants */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Medical Staff Colors</h4>
                    <div className="flex items-center space-x-3">
                      <CatalystAvatar initials="DR" size="md" color="emerald" alt="Doctor" />
                      <CatalystAvatar initials="RN" size="md" color="blue" alt="Registered Nurse" />
                      <CatalystAvatar initials="MA" size="md" color="orange" alt="Medical Assistant" />
                      <CatalystAvatar initials="PT" size="md" color="purple" alt="Physical Therapist" />
                      <CatalystAvatar initials="AD" size="md" color="red" alt="Administrator" />
                      <CatalystAvatar initials="SC" size="md" color="teal" alt="Scheduler" />
                    </div>
                  </div>

                  {/* Square variants */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Square Avatars (for badges/IDs)</h4>
                    <div className="flex items-center space-x-3">
                      <CatalystAvatar initials="ID" size="md" color="zinc" square />
                      <CatalystAvatar initials="VIP" size="md" color="yellow" square />
                      <CatalystAvatar initials="ER" size="md" color="red" square />
                      <CatalystAvatar initials="OR" size="md" color="green" square />
                    </div>
                  </div>

                  {/* Medical workflow examples */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Medical Workflow Examples</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <CatalystAvatar initials="SJ" size="md" color="blue" alt="Dr. Sarah Johnson" />
                        <div>
                          <div className="font-medium text-sm">Dr. Sarah Johnson</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">Dermatologist - Currently Available</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <CatalystAvatar initials="MC" size="md" color="green" alt="Mike Chen, RN" />
                        <div>
                          <div className="font-medium text-sm">Mike Chen, RN</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">Nurse - Room 3</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <CatalystAvatar initials="AS" size="md" color="orange" alt="Anna Smith, MA" />
                        <div>
                          <div className="font-medium text-sm">Anna Smith, MA</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">Medical Assistant - Front Desk</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-generated colors */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Auto-Generated Colors (from names)</h4>
                    <div className="flex items-center space-x-3">
                      <CatalystAvatar alt="Alice Johnson" initials="AJ" size="md" />
                      <CatalystAvatar alt="Bob Williams" initials="BW" size="md" />
                      <CatalystAvatar alt="Carol Davis" initials="CD" size="md" />
                      <CatalystAvatar alt="David Miller" initials="DM" size="md" />
                      <CatalystAvatar alt="Eva Brown" initials="EB" size="md" />
                    </div>
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Loading Spinner"
                code={`<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />`}
              >
                <div className="flex items-center space-x-4">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Catalyst LoadingSpinner Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">🎨 Catalyst Loading Spinners (New Design System)</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Size Variations"
                code={`<CatalystLoadingSpinner size="xs" />
<CatalystLoadingSpinner size="sm" />
<CatalystLoadingSpinner size="md" />
<CatalystLoadingSpinner size="lg" />
<CatalystLoadingSpinner size="xl" />`}
              >
                <div className="flex items-center gap-4">
                  <CatalystLoadingSpinner size="xs" />
                  <CatalystLoadingSpinner size="sm" />
                  <CatalystLoadingSpinner size="md" />
                  <CatalystLoadingSpinner size="lg" />
                  <CatalystLoadingSpinner size="xl" />
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Color Variants"
                code={`<CatalystLoadingSpinner color="primary" />
<CatalystLoadingSpinner color="success" />
<CatalystLoadingSpinner color="warning" />
<CatalystLoadingSpinner color="danger" />`}
              >
                <div className="flex items-center gap-4">
                  <CatalystLoadingSpinner color="primary" />
                  <CatalystLoadingSpinner color="success" />
                  <CatalystLoadingSpinner color="warning" />
                  <CatalystLoadingSpinner color="danger" />
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="With Text Labels"
                code={`<CatalystLoadingSpinner text="Loading patients..." />
<CatalystLoadingSpinner text="Processing authorization..." color="warning" />
<CatalystLoadingSpinner text="Uploading documents..." color="success" size="sm" />`}
              >
                <div className="space-y-4">
                  <CatalystLoadingSpinner text="Loading patients..." />
                  <CatalystLoadingSpinner text="Processing authorization..." color="warning" />
                  <CatalystLoadingSpinner text="Uploading documents..." color="success" size="sm" />
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Medical Context Examples"
                code={`<CatalystLoadingSpinner text="Connecting to EHR..." color="primary" center />
<CatalystLoadingSpinner text="Verifying insurance..." color="warning" center />
<CatalystLoadingSpinner text="Generating report..." color="success" center />`}
              >
                <div className="space-y-6">
                  <CatalystLoadingSpinner text="Connecting to EHR..." color="primary" center />
                  <CatalystLoadingSpinner text="Verifying insurance..." color="warning" center />
                  <CatalystLoadingSpinner text="Generating report..." color="success" center />
                </div>
              </ComponentDemo>
            </div>
            
            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">✨ Catalyst LoadingSpinner Improvements</h3>
              <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                <li>• Enhanced size range: xs, sm, md, lg, xl (vs sm, md, lg)</li>
                <li>• Semantic color variants for different states</li>
                <li>• Better accessibility with ARIA labels and screen reader text</li>
                <li>• Optimized animations with Catalyst design tokens</li>
                <li>• Improved contrast for medical applications</li>
                <li>• Professional spacing and typography</li>
              </ul>
            </div>
          </section>

          {/* Data Table */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Data Table</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Sample Data Table"
                code={`<DataTable
  data={sampleData}
  columns={columns}
/>`}
              >
                <DataTable
                  data={sampleData}
                  columns={columns}
                />
              </ComponentDemo>

              <ComponentDemo 
                title="DataTable - Catalyst UI ✨"
                code={`// Enhanced medical staff data
const medicalStaffData = [
  { 
    id: 1, 
    name: 'Dr. Sarah Johnson', 
    role: 'Dermatologist', 
    department: 'Dermatology',
    location: 'Plymouth Main',
    status: 'Available',
    patients: 8,
    nextAppointment: '2:00 PM'
  },
  { 
    id: 2, 
    name: 'Mike Chen, RN', 
    role: 'Registered Nurse', 
    department: 'Clinical Support',
    location: 'Plymouth Main',
    status: 'In Room 3',
    patients: 4,
    nextAppointment: '2:15 PM'
  },
  // ... more data
];

const medicalColumns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'department', header: 'Department' },
  { key: 'location', header: 'Location' },
  { 
    key: 'status', 
    header: 'Status',
    render: (item) => (
      <Badge color={getStatusColor(item.status)}>
        {item.status}
      </Badge>
    )
  },
  { key: 'patients', header: 'Patients Today', align: 'center' },
  { key: 'nextAppointment', header: 'Next Appointment' }
];

<CatalystDataTable
  data={medicalStaffData}
  columns={medicalColumns}
  onRowClick={(staff) => alert(\`Viewing \${staff.name}\`)}
  sortBy="name"
  sortDirection="asc"
  onSort={(key) => handleSort(key)}
  hoverable={true}
  rounded="lg"
/>`}
              >
                <div className="space-y-6">
                  {/* Enhanced Medical Data Table */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Medical Staff Dashboard</h4>
                    <CatalystDataTable
                      data={[
                        { 
                          id: 1, 
                          name: 'Dr. Sarah Johnson', 
                          role: 'Dermatologist', 
                          department: 'Dermatology',
                          location: 'Plymouth Main',
                          status: 'Available',
                          patients: 8,
                          nextAppointment: '2:00 PM'
                        },
                        { 
                          id: 2, 
                          name: 'Mike Chen, RN', 
                          role: 'Registered Nurse', 
                          department: 'Clinical Support',
                          location: 'Plymouth Main',
                          status: 'In Room 3',
                          patients: 4,
                          nextAppointment: '2:15 PM'
                        },
                        { 
                          id: 3, 
                          name: 'Dr. Emily Rodriguez', 
                          role: 'Physician Assistant', 
                          department: 'Primary Care',
                          location: 'Westland Clinic',
                          status: 'With Patient',
                          patients: 6,
                          nextAppointment: '2:30 PM'
                        },
                        { 
                          id: 4, 
                          name: 'Anna Smith, MA', 
                          role: 'Medical Assistant', 
                          department: 'Clinical Support',
                          location: 'Plymouth Main',
                          status: 'Available',
                          patients: 12,
                          nextAppointment: '1:45 PM'
                        }
                      ]}
                      columns={[
                        { 
                          key: 'name', 
                          header: 'Staff Member', 
                          sortable: true,
                          render: (item) => (
                            <div className="flex items-center space-x-3">
                              <CatalystAvatar initials={item.name.split(' ').map(n => n[0]).join('')} size="sm" />
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-zinc-500">{item.role}</div>
                              </div>
                            </div>
                          )
                        },
                        { key: 'department', header: 'Department', sortable: true },
                        { key: 'location', header: 'Location' },
                        { 
                          key: 'status', 
                          header: 'Current Status',
                          render: (item) => {
                            const getStatusColor = (status: string) => {
                              switch(status) {
                                case 'Available': return 'green'
                                case 'With Patient': return 'blue'
                                case 'In Room 3': return 'orange'
                                default: return 'zinc'
                              }
                            }
                            return (
                              <CatalystBadge color={getStatusColor(item.status)} size="sm">
                                {item.status}
                              </CatalystBadge>
                            )
                          }
                        },
                        { 
                          key: 'patients', 
                          header: 'Patients Today', 
                          align: 'center',
                          render: (item) => (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {item.patients}
                            </span>
                          )
                        },
                        { key: 'nextAppointment', header: 'Next Appointment', align: 'center' }
                      ]}
                      onRowClick={(staff) => alert(`Viewing details for ${staff.name}`)}
                      hoverable={true}
                      rounded="lg"
                    />
                  </div>

                  {/* Compact Patient List */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Patient Appointments (Dense Mode)</h4>
                    <CatalystDataTable
                      data={[
                        { id: 'P001', name: 'John Doe', time: '2:00 PM', type: 'Annual Checkup', provider: 'Dr. Johnson', status: 'Checked In' },
                        { id: 'P002', name: 'Jane Smith', time: '2:15 PM', type: 'Follow-up', provider: 'Dr. Johnson', status: 'Waiting' },
                        { id: 'P003', name: 'Robert Wilson', time: '2:30 PM', type: 'Skin Cancer Screening', provider: 'Dr. Rodriguez', status: 'In Room' },
                        { id: 'P004', name: 'Maria Garcia', time: '2:45 PM', type: 'Consultation', provider: 'Dr. Johnson', status: 'Scheduled' }
                      ]}
                      columns={[
                        { key: 'id', header: 'MRN', width: '80px' },
                        { key: 'name', header: 'Patient', sortable: true },
                        { key: 'time', header: 'Time', width: '100px', align: 'center' },
                        { key: 'type', header: 'Appointment Type' },
                        { key: 'provider', header: 'Provider' },
                        { 
                          key: 'status', 
                          header: 'Status',
                          render: (item) => {
                            const getStatusColor = (status: string) => {
                              switch(status) {
                                case 'Checked In': return 'green'
                                case 'In Room': return 'blue'
                                case 'Waiting': return 'yellow'
                                case 'Scheduled': return 'zinc'
                                default: return 'zinc'
                              }
                            }
                            return (
                              <CatalystBadge color={getStatusColor(item.status)} size="sm">
                                {item.status}
                              </CatalystBadge>
                            )
                          }
                        }
                      ]}
                      dense={true}
                      striped={true}
                      hoverable={true}
                      rounded="md"
                    />
                  </div>

                  {/* Empty State Demo */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Empty State</h4>
                    <CatalystDataTable
                      data={[]}
                      columns={[
                        { key: 'name', header: 'Patient Name' },
                        { key: 'appointment', header: 'Appointment Time' },
                        { key: 'status', header: 'Status' }
                      ]}
                      emptyMessage="No appointments scheduled for today"
                      rounded="lg"
                    />
                  </div>

                  {/* Loading State Demo */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Loading State</h4>
                    <CatalystDataTable
                      data={[]}
                      columns={[
                        { key: 'name', header: 'Patient Name' },
                        { key: 'appointment', header: 'Appointment Time' },
                        { key: 'status', header: 'Status' }
                      ]}
                      loading={true}
                    />
                  </div>
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Modal */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Modal</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Modal Dialog"
                code={`<Button onClick={() => setModalOpen(true)}>
  Open Modal
</Button>
<Modal 
  isOpen={modalOpen} 
  onClose={() => setModalOpen(false)}
  title="Sample Modal"
>
  <p>This is modal content.</p>
</Modal>`}
              >
                <Button onClick={() => setModalOpen(true)}>
                  Open Modal
                </Button>
                <Modal 
                  isOpen={modalOpen} 
                  onClose={() => setModalOpen(false)}
                  title="Sample Modal"
                >
                  <p className="text-neutral-700 dark:text-neutral-300">
                    This is a sample modal dialog. You can place any content here.
                  </p>
                </Modal>
              </ComponentDemo>

              <ComponentDemo 
                title="Modal - Catalyst UI ✨"
                code={`<Button onClick={() => setCatalystModal1(true)}>
  Open Basic Modal
</Button>
<CatalystModal 
  isOpen={catalystModal1} 
  onClose={() => setCatalystModal1(false)}
  title="Patient Appointment Details"
>
  <CatalystModalContent>
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Appointment Information</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Dr. Sarah Johnson - December 21, 2024 at 2:00 PM
        </p>
      </div>
      <div>
        <h4 className="font-medium">Patient</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          John Doe (MRN: 123456)
        </p>
      </div>
    </div>
  </CatalystModalContent>
  <CatalystModalFooter>
    <Button variant="outline" onClick={() => setCatalystModal1(false)}>
      Cancel
    </Button>
    <Button variant="primary">
      Confirm Appointment
    </Button>
  </CatalystModalFooter>
</CatalystModal>

// Large Modal with Medical Form
<CatalystModal 
  isOpen={catalystModal2} 
  onClose={() => setCatalystModal2(false)}
  title="Patient Registration"
  size="lg"
>
  <CatalystModalContent>
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="First Name" className="p-2 border rounded" />
        <input placeholder="Last Name" className="p-2 border rounded" />
      </div>
      <input placeholder="Date of Birth" type="date" className="w-full p-2 border rounded" />
      <textarea placeholder="Medical History" className="w-full p-2 border rounded h-24"></textarea>
    </form>
  </CatalystModalContent>
  <CatalystModalFooter>
    <Button variant="outline" onClick={() => setCatalystModal2(false)}>
      Cancel
    </Button>
    <Button variant="primary">
      Save Patient
    </Button>
  </CatalystModalFooter>
</CatalystModal>`}
              >
                <div className="space-y-6">
                  {/* Basic Modal */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Basic Modal</h4>
                    <Button onClick={() => setCatalystModal1(true)}>
                      Open Patient Details
                    </Button>
                    <CatalystModal 
                      isOpen={catalystModal1} 
                      onClose={() => setCatalystModal1(false)}
                      title="Patient Appointment Details"
                    >
                      <CatalystModalContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">Appointment Information</h4>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                              Dr. Sarah Johnson - December 21, 2024 at 2:00 PM
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium">Patient</h4>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                              John Doe (MRN: 123456)
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium">Appointment Type</h4>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                              Annual skin examination
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium">Insurance</h4>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                              Blue Cross Blue Shield - Verified
                            </p>
                          </div>
                        </div>
                      </CatalystModalContent>
                      <CatalystModalFooter>
                        <Button variant="outline" onClick={() => setCatalystModal1(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary">
                          Confirm Appointment
                        </Button>
                      </CatalystModalFooter>
                    </CatalystModal>
                  </div>

                  {/* Large Modal with Form */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Large Modal with Form</h4>
                    <Button onClick={() => setCatalystModal2(true)}>
                      Open Registration Form
                    </Button>
                    <CatalystModal 
                      isOpen={catalystModal2} 
                      onClose={() => setCatalystModal2(false)}
                      title="New Patient Registration"
                      size="lg"
                    >
                      <CatalystModalContent>
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium mb-3">Personal Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">First Name</label>
                                <input placeholder="John" className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Last Name</label>
                                <input placeholder="Doe" className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                <input type="date" className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Phone Number</label>
                                <input placeholder="(555) 123-4567" className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3">Medical Information</h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Primary Insurance</label>
                                <select className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md">
                                  <option>Select insurance provider...</option>
                                  <option>Blue Cross Blue Shield</option>
                                  <option>Aetna</option>
                                  <option>Cigna</option>
                                  <option>United Healthcare</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Medical History</label>
                                <textarea 
                                  placeholder="Please describe any relevant medical history, allergies, or current medications..."
                                  className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md h-24"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CatalystModalContent>
                      <CatalystModalFooter>
                        <Button variant="outline" onClick={() => setCatalystModal2(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary">
                          Register Patient
                        </Button>
                      </CatalystModalFooter>
                    </CatalystModal>
                  </div>

                  {/* Different Sizes */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Modal Sizes</h4>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setCatalystModal3(true)}>
                        Small Alert
                      </Button>
                    </div>
                    <CatalystModal 
                      isOpen={catalystModal3} 
                      onClose={() => setCatalystModal3(false)}
                      title="Confirmation Required"
                      size="sm"
                    >
                      <CatalystModalContent>
                        <p className="text-sm">
                          Are you sure you want to delete this patient record? This action cannot be undone.
                        </p>
                      </CatalystModalContent>
                      <CatalystModalFooter>
                        <Button variant="outline" size="sm" onClick={() => setCatalystModal3(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </CatalystModalFooter>
                    </CatalystModal>
                  </div>
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Alert Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Alerts & Notifications</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Alert Variants"
                code={`<Alert variant="info">This is an info alert</Alert>
<Alert variant="success">This is a success alert</Alert>
<Alert variant="warning">This is a warning alert</Alert>
<Alert variant="error">This is an error alert</Alert>
<Alert variant="destructive">This is a destructive alert</Alert>
<Alert variant="default">This is a default alert</Alert>`}
              >
                <div className="space-y-3">
                  <Alert variant="info">This is an info alert - used for general information</Alert>
                  <Alert variant="success">This is a success alert - operation completed successfully</Alert>
                  <Alert variant="warning">This is a warning alert - please pay attention</Alert>
                  <Alert variant="error">This is an error alert - something went wrong</Alert>
                  <Alert variant="destructive">This is a destructive alert - action cannot be undone</Alert>
                  <Alert variant="default">This is a default alert - general message</Alert>
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Catalyst Alert Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">🎨 Catalyst Alerts (New Design System)</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Catalyst Alert Colors"
                code={`<CatalystAlert color="blue">Information alert with improved accessibility</CatalystAlert>
<CatalystAlert color="green">Success alert with better dark mode</CatalystAlert>
<CatalystAlert color="yellow">Warning alert with professional styling</CatalystAlert>
<CatalystAlert color="red">Error alert with enhanced contrast</CatalystAlert>`}
              >
                <div className="space-y-3">
                  <CatalystAlert color="blue">
                    <div className="font-semibold">Information</div>
                    <div className="text-sm mt-1">Blue alert with improved accessibility and ARIA live regions</div>
                  </CatalystAlert>
                  <CatalystAlert color="green">
                    <div className="font-semibold">Success</div>
                    <div className="text-sm mt-1">Green alert with better dark mode support</div>
                  </CatalystAlert>
                  <CatalystAlert color="yellow">
                    <div className="font-semibold">Warning</div>
                    <div className="text-sm mt-1">Yellow alert with professional Catalyst styling</div>
                  </CatalystAlert>
                  <CatalystAlert color="red">
                    <div className="font-semibold">Error</div>
                    <div className="text-sm mt-1">Red alert with enhanced contrast ratios</div>
                  </CatalystAlert>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Extended Color Palette"
                code={`<CatalystAlert color="indigo">Indigo alert for premium features</CatalystAlert>
<CatalystAlert color="purple">Purple alert for special notices</CatalystAlert>
<CatalystAlert color="emerald">Emerald alert for environmental messages</CatalystAlert>
<CatalystAlert color="orange">Orange alert for moderate warnings</CatalystAlert>`}
              >
                <div className="space-y-3">
                  <CatalystAlert color="indigo">
                    <div className="font-semibold">Premium Feature</div>
                    <div className="text-sm mt-1">Indigo alerts for premium or special features</div>
                  </CatalystAlert>
                  <CatalystAlert color="purple">
                    <div className="font-semibold">Special Notice</div>
                    <div className="text-sm mt-1">Purple alerts for important announcements</div>
                  </CatalystAlert>
                  <CatalystAlert color="emerald">
                    <div className="font-semibold">Environmental</div>
                    <div className="text-sm mt-1">Emerald alerts for eco-friendly messages</div>
                  </CatalystAlert>
                  <CatalystAlert color="orange">
                    <div className="font-semibold">Moderate Warning</div>
                    <div className="text-sm mt-1">Orange alerts for moderate priority warnings</div>
                  </CatalystAlert>
                </div>
              </ComponentDemo>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">✨ Catalyst Alert Improvements</h3>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• 18 semantic color variants (vs 6 basic variants)</li>
                <li>• Enhanced dark mode with proper contrast ratios</li>
                <li>• ARIA live regions for better screen reader support</li>
                <li>• Professional Catalyst design tokens</li>
                <li>• Consistent with medical application accessibility standards</li>
              </ul>
            </div>
          </section>

          {/* Progress Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Progress Indicators</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Progress Bar Variants"
                code={`<Progress value={25} variant="default" />
<Progress value={50} variant="default" />
<Progress value={75} variant="success" />
<Progress value={90} variant="warning" />`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Primary (25%)</div>
                    <Progress value={25} variant="default" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Secondary (50%)</div>
                    <Progress value={50} variant="default" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Success (75%)</div>
                    <Progress value={75} variant="success" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Warning (90%)</div>
                    <Progress value={90} variant="warning" />
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Progress with Labels"
                code={`<Progress value={60} />
<Progress value={100} variant="success" />`}
              >
                <div className="space-y-4">
                  <Progress value={60} />
                  <Progress value={100} variant="success" />
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Catalyst Progress Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">🎨 Catalyst Progress (New Design System)</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Catalyst Progress Colors"
                code={`<CatalystProgress value={25} color="blue" />
<CatalystProgress value={50} color="green" />
<CatalystProgress value={75} color="yellow" />
<CatalystProgress value={90} color="red" />`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Blue (25%)</div>
                    <CatalystProgress value={25} color="blue" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Green (50%)</div>
                    <CatalystProgress value={50} color="green" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Yellow (75%)</div>
                    <CatalystProgress value={75} color="yellow" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Red (90%)</div>
                    <CatalystProgress value={90} color="red" />
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Extended Color Palette"
                code={`<CatalystProgress value={40} color="indigo" />
<CatalystProgress value={60} color="purple" />
<CatalystProgress value={80} color="pink" />
<CatalystProgress value={100} color="emerald" />`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Indigo (40%)</div>
                    <CatalystProgress value={40} color="indigo" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Purple (60%)</div>
                    <CatalystProgress value={60} color="purple" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Pink (80%)</div>
                    <CatalystProgress value={80} color="pink" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Emerald (100%)</div>
                    <CatalystProgress value={100} color="emerald" />
                  </div>
                </div>
              </ComponentDemo>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">✨ Catalyst Design System Benefits</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Professional design system from Tailwind team</li>
                <li>• Enhanced color palette with 18 semantic colors</li>
                <li>• Better dark mode support</li>
                <li>• Accessibility improvements (better ARIA labels)</li>
                <li>• Consistent with Headless UI patterns</li>
              </ul>
            </div>
          </section>

          {/* Toast Notifications */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Toast Notifications</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Toast Notifications"
                code={`const { addToast } = useToast();

// Show different toast variants
addToast({ 
  title: "Success!", 
  message: "Operation completed", 
  type: "success" 
});

addToast({ 
  title: "Error", 
  message: "Something went wrong", 
  type: "error" 
});`}
              >
                <ToastDemo />
              </ComponentDemo>
            </div>
          </section>

          {/* Tabs Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Tabs Navigation</h2>
            <div className="component-demo">
              <ComponentDemo 
                title="Tab Component"
                code={`<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">General</TabsTrigger>
    <TabsTrigger value="tab2">Security</TabsTrigger>
    <TabsTrigger value="tab3">Advanced</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">General settings content</TabsContent>
  <TabsContent value="tab2">Security settings content</TabsContent>
  <TabsContent value="tab3">Advanced settings content</TabsContent>
</Tabs>`}
              >
                <Tabs defaultValue="tab1">
                  <TabsList>
                    <TabsTrigger value="tab1">General</TabsTrigger>
                    <TabsTrigger value="tab2">Security</TabsTrigger>
                    <TabsTrigger value="tab3">Advanced</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tab1">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">General Settings</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Configure your general application preferences here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="tab2">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">Security Settings</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage your security and privacy settings.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="tab3">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">Advanced Settings</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Advanced configuration options for power users.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </ComponentDemo>
            </div>
          </section>

          {/* Application-Specific Components */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Application-Specific Examples</h2>
            <div className="showcase-grid">
              <ComponentDemo title="Medical Status Indicators">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge style={{ backgroundColor: colors.medical.urgent }}>Urgent</Badge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Requires immediate attention</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge style={{ backgroundColor: colors.medical.approved }}>Approved</Badge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Authorization approved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge style={{ backgroundColor: colors.medical.pending }}>Pending</Badge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Awaiting review</span>
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo title="Inventory Status">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge style={{ backgroundColor: colors.inventory.inStock }}>In Stock</Badge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge style={{ backgroundColor: colors.inventory.lowStock }}>Low Stock</Badge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Reorder needed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge style={{ backgroundColor: colors.inventory.outOfStock }}>Out of Stock</Badge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Unavailable</span>
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo title="EOS L10 Meeting Card">
                <Card style={{ borderColor: colors.eos[400] }}>
                  <CardHeader>
                    <CardTitle style={{ color: colors.eos[700] }}>Weekly L10 Meeting</CardTitle>
                    <CardDescription>Team coordination and strategy session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Badge style={{ backgroundColor: colors.eos[500] }}>In Progress</Badge>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">45 min remaining</span>
                    </div>
                  </CardContent>
                </Card>
              </ComponentDemo>

              <ComponentDemo title="Staff Role Cards">
                <div className="space-y-3">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-3">
                        <Avatar initials="MA" size="sm" />
                        <div>
                          <div className="font-medium">Medical Assistant</div>
                          <Badge style={{ backgroundColor: colors.primary[500] }}>Active</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-3">
                        <Avatar initials="RN" size="sm" />
                        <div>
                          <div className="font-medium">Registered Nurse</div>
                          <Badge style={{ backgroundColor: colors.secondary[500] }}>Available</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Catalyst Badge Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">🎨 Catalyst Badges (New Design System)</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Catalyst Badge Colors"
                code={`<CatalystBadge color="blue">Information</CatalystBadge>
<CatalystBadge color="green">Success</CatalystBadge>
<CatalystBadge color="yellow">Warning</CatalystBadge>
<CatalystBadge color="red">Error</CatalystBadge>
<CatalystBadge color="zinc">Neutral</CatalystBadge>`}
              >
                <div className="flex flex-wrap gap-2">
                  <CatalystBadge color="blue">Information</CatalystBadge>
                  <CatalystBadge color="green">Success</CatalystBadge>
                  <CatalystBadge color="yellow">Warning</CatalystBadge>
                  <CatalystBadge color="red">Error</CatalystBadge>
                  <CatalystBadge color="zinc">Neutral</CatalystBadge>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Medical Badge Applications"
                code={`<CatalystBadge color="emerald">Approved</CatalystBadge>
<CatalystBadge color="amber">Pending</CatalystBadge>
<CatalystBadge color="violet">Priority</CatalystBadge>
<CatalystBadge color="orange">Review</CatalystBadge>`}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CatalystBadge color="emerald">Approved</CatalystBadge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Prior authorization approved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CatalystBadge color="amber">Pending</CatalystBadge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Awaiting insurance review</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CatalystBadge color="violet">Priority</CatalystBadge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">High priority patient</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CatalystBadge color="orange">Review</CatalystBadge>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Clinical review required</span>
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Size Variations"
                code={`<CatalystBadge size="sm" color="blue">Small</CatalystBadge>
<CatalystBadge size="md" color="blue">Medium</CatalystBadge>
<CatalystBadge size="lg" color="blue">Large</CatalystBadge>`}
              >
                <div className="flex items-center gap-3">
                  <CatalystBadge size="sm" color="blue">Small</CatalystBadge>
                  <CatalystBadge size="md" color="blue">Medium</CatalystBadge>
                  <CatalystBadge size="lg" color="blue">Large</CatalystBadge>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Extended Color Palette"
                code={`<CatalystBadge color="indigo">Indigo</CatalystBadge>
<CatalystBadge color="purple">Purple</CatalystBadge>
<CatalystBadge color="pink">Pink</CatalystBadge>
<CatalystBadge color="rose">Rose</CatalystBadge>
<CatalystBadge color="teal">Teal</CatalystBadge>
<CatalystBadge color="cyan">Cyan</CatalystBadge>`}
              >
                <div className="flex flex-wrap gap-2">
                  <CatalystBadge color="indigo">Indigo</CatalystBadge>
                  <CatalystBadge color="purple">Purple</CatalystBadge>
                  <CatalystBadge color="pink">Pink</CatalystBadge>
                  <CatalystBadge color="rose">Rose</CatalystBadge>
                  <CatalystBadge color="teal">Teal</CatalystBadge>
                  <CatalystBadge color="cyan">Cyan</CatalystBadge>
                </div>
              </ComponentDemo>
            </div>
            
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">✨ Catalyst Badge Benefits</h3>
              <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                <li>• 18 semantic colors for precise medical status indicators</li>
                <li>• Professional translucent backgrounds with perfect contrast</li>
                <li>• Enhanced dark mode with alpha channel opacity</li>
                <li>• Multiple sizes (sm, md, lg) for different contexts</li>
                <li>• Optimized for medical workflows and status tracking</li>
                <li>• Better visual hierarchy with Catalyst design tokens</li>
              </ul>
            </div>
          </section>

          {/* Catalyst Tabs Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">🎨 Catalyst Tabs (New Design System)</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Catalyst Tab Variants"
                code={`<CatalystTabs defaultValue="patients" variant="default">
  <CatalystTabsList>
    <CatalystTabsTrigger value="patients">Patients</CatalystTabsTrigger>
    <CatalystTabsTrigger value="appointments">Appointments</CatalystTabsTrigger>
    <CatalystTabsTrigger value="medications">Medications</CatalystTabsTrigger>
  </CatalystTabsList>
  <CatalystTabsContent value="patients">Patient management content</CatalystTabsContent>
</CatalystTabs>`}
              >
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Default Style</h4>
                    <CatalystTabs defaultValue="patients" variant="default">
                      <CatalystTabsList>
                        <CatalystTabsTrigger value="patients">Patients</CatalystTabsTrigger>
                        <CatalystTabsTrigger value="appointments">Appointments</CatalystTabsTrigger>
                        <CatalystTabsTrigger value="medications">Medications</CatalystTabsTrigger>
                      </CatalystTabsList>
                      <CatalystTabsContent value="patients">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Patient Management</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Manage patient records, appointments, and medical history.
                          </p>
                        </div>
                      </CatalystTabsContent>
                      <CatalystTabsContent value="appointments">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Appointment Scheduling</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Schedule and manage patient appointments across all locations.
                          </p>
                        </div>
                      </CatalystTabsContent>
                      <CatalystTabsContent value="medications">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Medication Management</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Track prescriptions, prior authorizations, and medication history.
                          </p>
                        </div>
                      </CatalystTabsContent>
                    </CatalystTabs>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Pills Style</h4>
                    <CatalystTabs defaultValue="overview" variant="pills">
                      <CatalystTabsList>
                        <CatalystTabsTrigger value="overview">Overview</CatalystTabsTrigger>
                        <CatalystTabsTrigger value="analytics">Analytics</CatalystTabsTrigger>
                        <CatalystTabsTrigger value="reports">Reports</CatalystTabsTrigger>
                      </CatalystTabsList>
                      <CatalystTabsContent value="overview">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Practice Overview</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            High-level view of practice performance and key metrics.
                          </p>
                        </div>
                      </CatalystTabsContent>
                      <CatalystTabsContent value="analytics">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Performance Analytics</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Detailed analytics and performance insights.
                          </p>
                        </div>
                      </CatalystTabsContent>
                      <CatalystTabsContent value="reports">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Custom Reports</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Generate and export custom practice reports.
                          </p>
                        </div>
                      </CatalystTabsContent>
                    </CatalystTabs>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">Underline Style</h4>
                    <CatalystTabs defaultValue="staff" variant="underline">
                      <CatalystTabsList>
                        <CatalystTabsTrigger value="staff">Staff</CatalystTabsTrigger>
                        <CatalystTabsTrigger value="schedule">Schedule</CatalystTabsTrigger>
                        <CatalystTabsTrigger value="training">Training</CatalystTabsTrigger>
                      </CatalystTabsList>
                      <CatalystTabsContent value="staff">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Staff Management</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Manage staff roles, permissions, and contact information.
                          </p>
                        </div>
                      </CatalystTabsContent>
                      <CatalystTabsContent value="schedule">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Staff Scheduling</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Create and manage staff schedules across all locations.
                          </p>
                        </div>
                      </CatalystTabsContent>
                      <CatalystTabsContent value="training">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <h4 className="font-medium mb-2">Training & Compliance</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Track staff training progress and compliance requirements.
                          </p>
                        </div>
                      </CatalystTabsContent>
                    </CatalystTabs>
                  </div>
                </div>
              </ComponentDemo>
            </div>
            
            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">✨ Catalyst Tabs Improvements</h3>
              <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                <li>• Three visual variants: default, pills, and underline</li>
                <li>• Enhanced ARIA attributes for screen readers</li>
                <li>• Better keyboard navigation support</li>
                <li>• Improved focus management and state tracking</li>
                <li>• Professional Catalyst design with proper contrast ratios</li>
                <li>• Optimized for medical application workflows</li>
              </ul>
            </div>
          </section>

          {/* Catalyst StatCard Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">🎨 Catalyst StatCard (New Design System)</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Medical Statistics Cards"
                code={`<CatalystStatCard
  title="Total Patients"
  value="1,247"
  icon={<UsersIcon />}
  trend={{ value: 12, direction: 'up', label: 'vs last month' }}
  variant="default"
/>`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CatalystStatCard
                    title="Total Patients"
                    value="1,247"
                    icon={
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    }
                    trend={{ value: 12, direction: 'up', label: 'vs last month' }}
                    variant="default"
                  />
                  
                  <CatalystStatCard
                    title="Appointments Today"
                    value="42"
                    icon={
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    }
                    trend={{ value: 5, direction: 'down', label: 'vs yesterday' }}
                    variant="info"
                  />
                  
                  <CatalystStatCard
                    title="Prior Auths Pending"
                    value="23"
                    icon={
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    }
                    trend={{ value: 8, direction: 'up', label: 'needs attention' }}
                    variant="warning"
                  />
                  
                  <CatalystStatCard
                    title="Revenue This Month"
                    value="$127,480"
                    icon={
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    }
                    trend={{ value: 15, direction: 'up', label: 'vs last month' }}
                    variant="success"
                  />
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Loading and Error States"
                code={`<CatalystStatCard
  title="Loading State"
  value="..."
  loading={true}
/>

<CatalystStatCard
  title="Inventory Status"
  value="Low Stock"
  variant="danger"
/>`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CatalystStatCard
                    title="Loading State"
                    value="..."
                    loading={true}
                    trend={{ value: 0, direction: 'up' }}
                  />
                  
                  <CatalystStatCard
                    title="System Status"
                    value="Operational"
                    icon={
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    }
                    variant="success"
                  />
                </div>
              </ComponentDemo>
            </div>
            
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">✨ Catalyst StatCard Benefits</h3>
              <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                <li>• Professional medical dashboard aesthetics</li>
                <li>• Integrated trend indicators with directional arrows</li>
                <li>• Multiple visual variants for different data types</li>
                <li>• Loading states with skeleton animations</li>
                <li>• Enhanced icon support with proper accessibility</li>
                <li>• Optimized for medical statistics and KPI displays</li>
              </ul>
            </div>
          </section>

          {/* Catalyst PageHeader Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">🎨 Catalyst PageHeader (New Design System)</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Medical Page Headers"
                code={`<CatalystPageHeader
  title="Patient Management"
  subtitle="Manage patient records and appointments"
  breadcrumbs={[
    { label: 'Dashboard', onClick: () => {} },
    { label: 'Patients' }
  ]}
  actions={<Button>Add Patient</Button>}
/>`}
              >
                <div className="space-y-6">
                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-1">
                    <CatalystPageHeader
                      title="Patient Management"
                      subtitle="Manage patient records, appointments, and medical history"
                      breadcrumbs={[
                        { label: 'Dashboard', onClick: () => {} },
                        { label: 'Patients' }
                      ]}
                      actions={
                        <Button variant="primary" size="sm">Add Patient</Button>
                      }
                    />
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-1">
                    <CatalystPageHeader
                      title="Platform Dashboard"
                      subtitle="System overview and key performance metrics"
                      actions={
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Export</Button>
                          <Button variant="primary" size="sm">Refresh</Button>
                        </div>
                      }
                      stats={[
                        { label: 'Active Patients', value: '1,247', trend: { value: 12, direction: 'up' } },
                        { label: 'Today\'s Appointments', value: '42' },
                        { label: 'Pending Auths', value: '23', trend: { value: 3, direction: 'down' } },
                        { label: 'Revenue MTD', value: '$127,480', trend: { value: 15, direction: 'up' } }
                      ]}
                      variant="default"
                    />
                  </div>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Header Variants"
                code={`// Minimal variant
<CatalystPageHeader
  title="Quick Settings"
  variant="minimal"
/>

// Centered variant
<CatalystPageHeader
  title="About Ganger Platform"
  subtitle="Medical practice management system"
  variant="centered"
/>`}
              >
                <div className="space-y-6">
                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-1">
                    <CatalystPageHeader
                      title="Quick Settings"
                      subtitle="Configure your preferences"
                      variant="minimal"
                      actions={<Button variant="outline" size="sm">Save</Button>}
                    />
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-1">
                    <CatalystPageHeader
                      title="About Ganger Platform"
                      subtitle="Comprehensive medical practice management system"
                      variant="centered"
                      badges={
                        <div className="flex gap-2">
                          <CatalystBadge color="blue">Version 2.1.0</CatalystBadge>
                          <CatalystBadge color="green">Production</CatalystBadge>
                        </div>
                      }
                    />
                  </div>
                </div>
              </ComponentDemo>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">✨ Catalyst PageHeader Benefits</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Consistent page header structure across all applications</li>
                <li>• Integrated breadcrumb navigation with ARIA support</li>
                <li>• Flexible action area for buttons and controls</li>
                <li>• Built-in statistics display with trend indicators</li>
                <li>• Multiple variants for different page types</li>
                <li>• Professional typography and spacing</li>
              </ul>
            </div>
          </section>

          {/* Catalyst FormField Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">🎨 Catalyst FormField (New Design System)</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Medical Form Fields"
                code={`<CatalystFormField
  label="Patient Name"
  required
  error="This field is required"
  hint="Enter patient's full legal name"
>
  <CatalystInput
    placeholder="Enter patient name"
    hasError={true}
  />
</CatalystFormField>`}
              >
                <div className="space-y-6">
                  <CatalystFormField
                    label="Patient Name"
                    helper="Enter the patient's full legal name as it appears on their insurance card"
                    required
                  >
                    <CatalystInput
                      placeholder="Enter patient name"
                    />
                  </CatalystFormField>

                  <CatalystFormField
                    label="Date of Birth"
                    error="Please enter a valid date"
                    required
                  >
                    <CatalystInput
                      type="date"
                    />
                  </CatalystFormField>

                  <CatalystFormField
                    label="Insurance Provider"
                    help="Select primary insurance provider"
                  >
                    <CatalystSelect>
                      <option value="">Select insurance provider...</option>
                      <option value="bcbs">Blue Cross Blue Shield</option>
                      <option value="aetna">Aetna</option>
                      <option value="cigna">Cigna</option>
                      <option value="uhc">United Healthcare</option>
                    </CatalystSelect>
                  </CatalystFormField>
                </div>
              </ComponentDemo>

              <ComponentDemo 
                title="Form Organization"
                code={`<div className="space-y-6">
  <div>
    <h3 className="text-lg font-medium">Patient Information</h3>
    <p className="text-sm text-zinc-600 dark:text-zinc-400">Enter basic patient details and contact information</p>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <CatalystFormField label="Email" required>
      <CatalystInput type="email" />
    </CatalystFormField>
    <CatalystFormField label="Phone" required>
      <CatalystInput type="tel" />
    </CatalystFormField>
  </div>
</div>`}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-zinc-900 dark:text-zinc-100">Patient Information</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Enter basic patient details and contact information
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-zinc-900 dark:text-zinc-100">Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CatalystFormField
                        label="Email Address"
                        required
                      >
                        <CatalystInput
                          type="email"
                          placeholder="patient@example.com"
                        />
                      </CatalystFormField>

                      <CatalystFormField
                        label="Phone Number"
                        required
                      >
                        <CatalystInput
                          type="tel"
                          placeholder="(555) 123-4567"
                        />
                      </CatalystFormField>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-zinc-900 dark:text-zinc-100">Medical Information</h4>
                    <CatalystFormField
                      label="Medical History"
                      helper="Please describe any relevant medical history, allergies, or current medications"
                    >
                      <textarea
                        className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white"
                        rows={4}
                        placeholder="Enter medical history, allergies, current medications..."
                      />
                    </CatalystFormField>
                  </div>
                </div>
              </ComponentDemo>
            </div>
            
            <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg">
              <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">✨ Catalyst FormField Benefits</h3>
              <ul className="text-sm text-violet-800 dark:text-violet-200 space-y-1">
                <li>• Structured form organization with sections and groups</li>
                <li>• Comprehensive validation and error messaging</li>
                <li>• WCAG 2.1 AA compliant labels and descriptions</li>
                <li>• Consistent spacing and typography</li>
                <li>• Medical form best practices built-in</li>
                <li>• Enhanced accessibility with proper ARIA attributes</li>
              </ul>
            </div>
          </section>

          {/* Summary */}
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Component System Summary</CardTitle>
                <CardDescription>
                  This showcase demonstrates the comprehensive design system used across all Ganger Platform applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 text-neutral-900 dark:text-neutral-100">Foundation</h4>
                    <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                      <li>• Comprehensive color system</li>
                      <li>• Typography with Inter font</li>
                      <li>• Accessible design tokens</li>
                      <li>• Dark mode support</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-neutral-900 dark:text-neutral-100">Components</h4>
                    <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                      <li>• 23 core UI components</li>
                      <li>• 🎨 Complete Catalyst migration (16/16 components)</li>
                      <li>• Consistent API patterns</li>
                      <li>• WCAG 2.1 AA compliance</li>
                      <li>• Mobile-responsive design</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-neutral-900 dark:text-neutral-100">Applications</h4>
                    <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                      <li>• 16 platform applications</li>
                      <li>• Medical-specific variants</li>
                      <li>• Role-based color coding</li>
                      <li>• Context-aware theming</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </ToastProvider>
  );
}