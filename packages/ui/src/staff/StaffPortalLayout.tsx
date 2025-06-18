'use client'

import { useState } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  Calendar, 
  Phone, 
  DollarSign, 
  BarChart3,
  ExternalLink,
  Home
} from 'lucide-react';

interface QuickAction {
  name: string;
  path: string;
  external?: boolean;
  description?: string;
}

interface WorkflowConnection {
  name: string;
  path: string;
  description: string;
  category: string;
}

interface StaffPortalLayoutProps {
  children: React.ReactNode;
  currentApp: string;
  relatedApps?: string[];
  quickActions?: QuickAction[];
  workflowConnections?: WorkflowConnection[];
  preservePWA?: boolean;
  hasExternalInterface?: boolean;
  specialIntegrations?: string[];
  preserveFinancialWorkflows?: boolean;
  complianceMode?: boolean;
  appDescription?: string;
  interfaceNote?: string;
  integrationNotes?: Record<string, string>;
}

const BUSINESS_OPERATIONS_APPS = [
  {
    name: 'EOS L10',
    path: '/l10',
    icon: BarChart3,
    category: 'Business',
    description: 'Team management and Level 10 meetings',
    roles: ['staff', 'manager', 'provider'],
    isPWA: true
  },
  {
    name: 'Pharma Scheduling',
    path: '/pharma-scheduling',
    icon: Calendar,
    category: 'Business',
    description: 'Pharmaceutical rep booking and management',
    roles: ['staff', 'manager'],
    hasExternalInterface: true
  },
  {
    name: 'Call Center Operations',
    path: '/phones',
    icon: Phone,
    category: 'Business',
    description: 'Patient communication and 3CX integration',
    roles: ['staff', 'manager'],
    specialIntegration: '3CX'
  },
  {
    name: 'Batch Closeout',
    path: '/batch',
    icon: DollarSign,
    category: 'Business',
    description: 'Financial operations and daily closeout',
    roles: ['staff', 'manager', 'billing']
  }
];

function AppNavigation({ currentApp, workflowConnections }: { 
  currentApp: string; 
  workflowConnections?: WorkflowConnection[];
}) {
  return (
    <nav className="mt-8">
      <div className="space-y-1">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Business Operations
        </h3>
        {BUSINESS_OPERATIONS_APPS.map((app) => {
          const isActive = app.path.includes(currentApp);
          return (
            <Link
              key={app.name}
              href={app.path}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <app.icon className="mr-3 h-5 w-5" />
              <span className="flex-1">{app.name}</span>
              {app.isPWA && (
                <span className="text-xs text-green-600">PWA</span>
              )}
              {app.hasExternalInterface && (
                <ExternalLink className="h-3 w-3 text-gray-400" />
              )}
            </Link>
          );
        })}
      </div>

      {workflowConnections && workflowConnections.length > 0 && (
        <div className="mt-6 space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Related Workflows
          </h3>
          {workflowConnections.map((connection) => (
            <Link
              key={connection.name}
              href={connection.path}
              className="group flex flex-col px-3 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="font-medium">{connection.name}</span>
              <span className="text-xs text-gray-500">{connection.description}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function QuickActionsPanel({ quickActions }: { quickActions?: QuickAction[] }) {
  if (!quickActions || quickActions.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            href={action.path}
            className={`flex items-center text-sm text-blue-600 hover:text-blue-800 ${
              action.external ? 'cursor-alias' : ''
            }`}
            {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {action.name}
            {action.external && <ExternalLink className="ml-1 h-3 w-3" />}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ 
  isOpen, 
  setIsOpen, 
  currentApp, 
  quickActions, 
  workflowConnections,
  appDescription,
  specialIntegrations
}: { 
  isOpen: boolean; 
  setIsOpen: (open: boolean) => void;
  currentApp: string;
  quickActions?: QuickAction[];
  workflowConnections?: WorkflowConnection[];
  appDescription?: string;
  specialIntegrations?: string[];
}) {
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white px-6 py-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Staff Portal</h1>
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            
            {appDescription && (
              <p className="mt-2 text-sm text-gray-600">{appDescription}</p>
            )}
            
            {specialIntegrations && specialIntegrations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {specialIntegrations.map((integration) => (
                  <span key={integration} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    {integration}
                  </span>
                ))}
              </div>
            )}

            <AppNavigation currentApp={currentApp} workflowConnections={workflowConnections} />
            <QuickActionsPanel quickActions={quickActions} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 ring-1 ring-gray-900/5">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/" className="flex items-center">
              <Home className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Staff Portal</h1>
            </Link>
          </div>
          
          {appDescription && (
            <p className="text-sm text-gray-600 -mt-3">{appDescription}</p>
          )}
          
          {specialIntegrations && specialIntegrations.length > 0 && (
            <div className="flex flex-wrap gap-1 -mt-2">
              {specialIntegrations.map((integration) => (
                <span key={integration} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                  {integration}
                </span>
              ))}
            </div>
          )}

          <AppNavigation currentApp={currentApp} workflowConnections={workflowConnections} />
          <QuickActionsPanel quickActions={quickActions} />
        </div>
      </div>
    </>
  );
}

function Header({ setIsOpen, currentApp }: { setIsOpen: (open: boolean) => void; currentApp: string }) {
  const currentAppInfo = BUSINESS_OPERATIONS_APPS.find(app => app.path.includes(currentApp));
  
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <h2 className="text-sm font-semibold leading-6 text-gray-900">
            {currentAppInfo?.name || 'Business Operations'}
          </h2>
          {currentAppInfo?.description && (
            <span className="ml-2 text-sm text-gray-500">
              • {currentAppInfo.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Ganger Dermatology Staff Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StaffPortalLayout({
  children,
  currentApp,
  relatedApps,
  quickActions,
  workflowConnections,
  preservePWA,
  hasExternalInterface,
  specialIntegrations,
  preserveFinancialWorkflows,
  complianceMode,
  appDescription,
  interfaceNote,
  integrationNotes
}: StaffPortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        currentApp={currentApp}
        quickActions={quickActions}
        workflowConnections={workflowConnections}
        appDescription={appDescription}
        specialIntegrations={specialIntegrations}
      />
      
      <div className="lg:pl-72">
        <Header setIsOpen={setSidebarOpen} currentApp={currentApp} />
        
        <main className="py-4">
          {interfaceNote && (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4">
              <div className="rounded-md bg-blue-50 p-4">
                <div className="text-sm text-blue-700">{interfaceNote}</div>
              </div>
            </div>
          )}
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}