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
  const { toast } = useToast();
  
  return (
    <div className="space-y-3">
      <Button 
        variant="primary" 
        onClick={() => toast({ title: "Success!", description: "Operation completed successfully", variant: "success" })}
      >
        Show Success Toast
      </Button>
      <Button 
        variant="secondary" 
        onClick={() => toast({ title: "Info", description: "Here's some information for you", variant: "info" })}
      >
        Show Info Toast
      </Button>
      <Button 
        variant="outline" 
        onClick={() => toast({ title: "Warning", description: "Please be careful with this action", variant: "warning" })}
      >
        Show Warning Toast
      </Button>
      <Button 
        variant="destructive" 
        onClick={() => toast({ title: "Error", description: "Something went wrong", variant: "error" })}
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

          {/* Data Table */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Data Table</h2>
            <div className="component-demo">
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
<Alert variant="neutral">This is a neutral alert</Alert>`}
              >
                <div className="space-y-3">
                  <Alert variant="info">This is an info alert - used for general information</Alert>
                  <Alert variant="success">This is a success alert - operation completed successfully</Alert>
                  <Alert variant="warning">This is a warning alert - please pay attention</Alert>
                  <Alert variant="error">This is an error alert - something went wrong</Alert>
                  <Alert variant="destructive">This is a destructive alert - action cannot be undone</Alert>
                  <Alert variant="neutral">This is a neutral alert - general message</Alert>
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Progress Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Progress Indicators</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Progress Bar Variants"
                code={`<Progress value={25} variant="primary" />
<Progress value={50} variant="secondary" />
<Progress value={75} variant="success" />
<Progress value={90} variant="warning" />`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Primary (25%)</div>
                    <Progress value={25} variant="primary" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Secondary (50%)</div>
                    <Progress value={50} variant="secondary" />
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
                code={`<Progress value={60} label="Upload Progress" showPercentage />
<Progress value={100} variant="success" label="Complete!" />`}
              >
                <div className="space-y-4">
                  <Progress value={60} label="Upload Progress" showPercentage />
                  <Progress value={100} variant="success" label="Complete!" />
                </div>
              </ComponentDemo>
            </div>
          </section>

          {/* Toast Notifications */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Toast Notifications</h2>
            <div className="showcase-grid">
              <ComponentDemo 
                title="Toast Notifications"
                code={`const { toast } = useToast();

// Show different toast variants
toast({ 
  title: "Success!", 
  description: "Operation completed", 
  variant: "success" 
});

toast({ 
  title: "Error", 
  description: "Something went wrong", 
  variant: "error" 
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