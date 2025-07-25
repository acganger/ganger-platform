export const dynamic = 'force-dynamic';

import { AuthGuard } from '@ganger/auth/staff';
import { useState } from 'react';
import { ApplicationsList } from '../components/ApplicationsList';
import { ConfigurationsList } from '../components/ConfigurationsList';
import { PermissionsPanel } from '../components/PermissionsPanel';
import { ImpersonationPanel } from '../components/ImpersonationPanel';
import { AuditLogViewer } from '../components/AuditLogViewer';
import { ApprovalWorkflow } from '../components/ApprovalWorkflow';
import { DashboardLayout } from '../components/DashboardLayout';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility

export default function ConfigDashboardHome() {
  const [activeTab, setActiveTab] = useState<'applications' | 'configurations' | 'permissions' | 'impersonation' | 'approval' | 'audit'>('applications');

  return (
    <AuthGuard level="admin">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuration Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage application configurations across the Ganger Platform</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('configurations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'configurations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configurations
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('impersonation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'impersonation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Impersonation
            </button>
            <button
              onClick={() => setActiveTab('approval')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approval'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approvals
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audit Logs
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'applications' && <ApplicationsList />}
          {activeTab === 'configurations' && <ConfigurationsList />}
          {activeTab === 'permissions' && <PermissionsPanel />}
          {activeTab === 'impersonation' && <ImpersonationPanel />}
          {activeTab === 'approval' && <ApprovalWorkflow />}
          {activeTab === 'audit' && <AuditLogViewer />}
        </div>
      </div>
    </DashboardLayout>
    </AuthGuard>
  );
}