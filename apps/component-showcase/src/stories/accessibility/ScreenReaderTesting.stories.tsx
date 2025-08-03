import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, Badge, Button } from '@ganger/ui-catalyst';

const meta: Meta = {
  title: 'Accessibility/Screen Reader Testing',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Components and patterns specifically designed for testing with screen readers like NVDA, JAWS, and VoiceOver.',
      },
    },
  },
};

export default meta;

export const DataTables: StoryObj = {
  render: () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Accessible Data Tables</h3>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Patient Appointments Table</h4>
            
            <table className="w-full" role="table" aria-label="Upcoming patient appointments">
              <caption className="sr-only">
                Table showing upcoming appointments with patient names, dates, times, and providers
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left p-2">Patient</th>
                  <th scope="col" className="text-left p-2">Date</th>
                  <th scope="col" className="text-left p-2">Time</th>
                  <th scope="col" className="text-left p-2">Provider</th>
                  <th scope="col" className="text-left p-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">John Doe</td>
                  <td className="p-2">
                    <time dateTime="2025-03-15">March 15, 2025</time>
                  </td>
                  <td className="p-2">10:00 AM</td>
                  <td className="p-2">Dr. Smith</td>
                  <td className="p-2">
                    <button 
                      className="text-cyan-600 hover:underline"
                      aria-label="View appointment details for John Doe on March 15"
                    >
                      View
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="p-2">Jane Smith</td>
                  <td className="p-2">
                    <time dateTime="2025-03-15">March 15, 2025</time>
                  </td>
                  <td className="p-2">2:30 PM</td>
                  <td className="p-2">Dr. Johnson</td>
                  <td className="p-2">
                    <button 
                      className="text-cyan-600 hover:underline"
                      aria-label="View appointment details for Jane Smith on March 15"
                    >
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-900 rounded text-sm">
              <h5 className="font-medium mb-1">Screen Reader Features:</h5>
              <ul className="space-y-1 text-xs">
                <li>• Table has descriptive aria-label</li>
                <li>• Caption provides context (hidden visually)</li>
                <li>• Column headers use scope="col"</li>
                <li>• Time elements use semantic HTML</li>
                <li>• Action buttons have descriptive labels</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
};

export const ComplexWidgets: StoryObj = {
  render: () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Complex Widget Accessibility</h3>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Patient Status Widget</h4>
            
            <div 
              className="grid grid-cols-3 gap-4"
              role="group"
              aria-labelledby="patient-stats-heading"
            >
              <h5 id="patient-stats-heading" className="sr-only">
                Patient statistics for today
              </h5>
              
              <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border">
                <div 
                  className="text-2xl font-bold text-green-600"
                  aria-label="45 patients checked in"
                >
                  45
                </div>
                <div className="text-sm text-neutral-600" aria-hidden="true">
                  Checked In
                </div>
              </div>
              
              <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border">
                <div 
                  className="text-2xl font-bold text-orange-600"
                  aria-label="12 patients in waiting room"
                >
                  12
                </div>
                <div className="text-sm text-neutral-600" aria-hidden="true">
                  Waiting
                </div>
              </div>
              
              <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border">
                <div 
                  className="text-2xl font-bold text-blue-600"
                  aria-label="8 patients with provider"
                >
                  8
                </div>
                <div className="text-sm text-neutral-600" aria-hidden="true">
                  With Provider
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Appointment Status List</h4>
            
            <ul role="list" aria-label="Today's appointments">
              <li className="flex justify-between items-center p-3 border-b">
                <div>
                  <div className="font-medium">John Doe</div>
                  <div className="text-sm text-neutral-600">
                    <span className="sr-only">Appointment at</span>
                    <time dateTime="10:00">10:00 AM</time>
                    <span aria-hidden="true"> • </span>
                    <span>Dr. Smith</span>
                  </div>
                </div>
                <Badge color="green" aria-label="Status: Completed">
                  <span aria-hidden="true">Completed</span>
                </Badge>
              </li>
              
              <li className="flex justify-between items-center p-3 border-b">
                <div>
                  <div className="font-medium">Jane Smith</div>
                  <div className="text-sm text-neutral-600">
                    <span className="sr-only">Appointment at</span>
                    <time dateTime="14:30">2:30 PM</time>
                    <span aria-hidden="true"> • </span>
                    <span>Dr. Johnson</span>
                  </div>
                </div>
                <Badge color="blue" aria-label="Status: In Progress">
                  <span aria-hidden="true">In Progress</span>
                </Badge>
              </li>
              
              <li className="flex justify-between items-center p-3">
                <div>
                  <div className="font-medium">Bob Wilson</div>
                  <div className="text-sm text-neutral-600">
                    <span className="sr-only">Appointment at</span>
                    <time dateTime="15:00">3:00 PM</time>
                    <span aria-hidden="true"> • </span>
                    <span>Dr. Brown</span>
                  </div>
                </div>
                <Badge color="orange" aria-label="Status: Waiting">
                  <span aria-hidden="true">Waiting</span>
                </Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  },
};

export const AnnouncementPatterns: StoryObj = {
  render: () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Screen Reader Announcements</h3>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Descriptive Link Text</h4>
            
            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded">
                <p className="text-sm mb-2">❌ Bad Example:</p>
                <p>
                  Patient John Doe has new lab results. 
                  <a href="#" className="text-cyan-600 hover:underline">Click here</a> to view.
                </p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <p className="text-sm mb-2">✅ Good Example:</p>
                <p>
                  Patient John Doe has new lab results. 
                  <a href="#" className="text-cyan-600 hover:underline">
                    View John Doe's lab results
                  </a>
                </p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <p className="text-sm mb-2">✅ Alternative with aria-label:</p>
                <p>
                  John Doe - Lab Results 
                  <a 
                    href="#" 
                    className="text-cyan-600 hover:underline"
                    aria-label="View lab results for John Doe from March 15, 2025"
                  >
                    View
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Icon Buttons</h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button 
                  className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Edit patient record"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button 
                  className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Delete appointment"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                
                <button 
                  className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Print patient summary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              </div>
              
              <p className="text-sm text-neutral-600">
                Icons have aria-hidden="true" and buttons have descriptive aria-labels
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Context-Aware Messages</h4>
            
            <div className="space-y-3">
              <div role="status" className="p-3 bg-green-100 dark:bg-green-900/20 rounded">
                <p className="text-green-800 dark:text-green-200">
                  <span className="font-medium">Success:</span> Patient record updated successfully
                </p>
              </div>
              
              <div role="alert" className="p-3 bg-red-100 dark:bg-red-900/20 rounded">
                <p className="text-red-800 dark:text-red-200">
                  <span className="font-medium">Error:</span> Failed to save appointment. Please check required fields.
                </p>
              </div>
              
              <div role="status" aria-live="polite" className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded">
                <p className="text-blue-800 dark:text-blue-200">
                  <span className="sr-only">Information:</span>
                  <span className="font-medium" aria-hidden="true">Info:</span> Next appointment available in 30 minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
};

export const NavigationLandmarks: StoryObj = {
  render: () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">ARIA Landmarks</h3>
        
        <div className="border rounded-lg overflow-hidden">
          <header role="banner" className="bg-cyan-600 text-white p-4">
            <h1 className="text-xl font-bold">Ganger Dermatology Portal</h1>
          </header>
          
          <div className="flex min-h-[400px]">
            <nav role="navigation" aria-label="Main navigation" className="w-64 bg-neutral-100 dark:bg-neutral-800 p-4">
              <h2 className="sr-only">Main Navigation</h2>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="block p-2 rounded hover:bg-white dark:hover:bg-neutral-700">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="block p-2 rounded bg-white dark:bg-neutral-700" aria-current="page">
                    Patients
                  </a>
                </li>
                <li>
                  <a href="#" className="block p-2 rounded hover:bg-white dark:hover:bg-neutral-700">
                    Appointments
                  </a>
                </li>
              </ul>
            </nav>
            
            <main role="main" className="flex-1 p-6">
              <h2 className="text-xl font-semibold mb-4">Patient Management</h2>
              
              <section aria-labelledby="search-heading" className="mb-6">
                <h3 id="search-heading" className="sr-only">Search Patients</h3>
                <form role="search" className="flex gap-2">
                  <label htmlFor="patient-search" className="sr-only">
                    Search patients by name or ID
                  </label>
                  <input
                    id="patient-search"
                    type="search"
                    placeholder="Search patients..."
                    className="flex-1 px-3 py-2 border rounded"
                  />
                  <Button type="submit">Search</Button>
                </form>
              </section>
              
              <section aria-labelledby="results-heading">
                <h3 id="results-heading" className="text-lg font-medium mb-3">
                  Search Results
                </h3>
                <p>Content goes here...</p>
              </section>
            </main>
            
            <aside role="complementary" aria-label="Patient quick stats" className="w-64 bg-neutral-50 dark:bg-neutral-900 p-4">
              <h2 className="font-medium mb-3">Quick Stats</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-neutral-600">Total Patients</dt>
                  <dd className="font-bold">1,234</dd>
                </div>
                <div>
                  <dt className="text-neutral-600">Today's Appointments</dt>
                  <dd className="font-bold">28</dd>
                </div>
              </dl>
            </aside>
          </div>
          
          <footer role="contentinfo" className="bg-neutral-100 dark:bg-neutral-800 p-4 text-sm text-neutral-600">
            <p>© 2025 Ganger Dermatology. All rights reserved.</p>
          </footer>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Landmark Regions Used</h4>
            <ul className="space-y-1 text-sm">
              <li>• <code>role="banner"</code> - Header/masthead</li>
              <li>• <code>role="navigation"</code> - Primary navigation</li>
              <li>• <code>role="main"</code> - Main content area</li>
              <li>• <code>role="search"</code> - Search functionality</li>
              <li>• <code>role="complementary"</code> - Supporting content</li>
              <li>• <code>role="contentinfo"</code> - Footer information</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  },
};