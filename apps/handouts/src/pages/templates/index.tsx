export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { 
  AppLayout, 
  PageHeader, 
  Button,
  Card,
  LoadingSpinner 
} from '@ganger/ui';
import { Input, DataTable } from '@ganger/ui-catalyst';
import { analytics } from '@ganger/utils';
import { useHandoutContext } from '@/lib/handout-context';

interface Template {
  id: string;
  name: string;
  category: string;
  complexity: 'simple' | 'moderate' | 'complex';
  digitalDeliveryEnabled: boolean;
  isActive: boolean;
  lastModified: string;
  usageCount: number;
}

function TemplatesPage() {
  const { user, profile } = useStaffAuth();
  const { state, loadTemplates } = useHandoutContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadTemplates();
        
        // Fetch real templates from API
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        
        const { data } = await response.json();
        setTemplates(data || []);
        
        analytics.track('templates_page_viewed', 'navigation', {
          user_role: profile?.role,
          template_count: data?.length || 0
        });
      } catch (error) {
        console.error('Error loading templates:', error);
        // Set empty array on error to avoid showing stale data
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadTemplates, profile]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const columns = [
    { key: 'name', header: 'Template Name', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { 
      key: 'complexity', 
      header: 'Complexity', 
      sortable: true,
      render: (item: Template) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full template-complexity-${item.complexity}`}>
          {item.complexity}
        </span>
      )
    },
    { 
      key: 'usageCount', 
      header: 'Usage (30d)', 
      sortable: true,
      render: (item: Template) => item.usageCount.toLocaleString()
    },
    { 
      key: 'digitalDeliveryEnabled', 
      header: 'Digital Delivery', 
      render: (item: Template) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.digitalDeliveryEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {item.digitalDeliveryEnabled ? 'Enabled' : 'Print Only'}
        </span>
      )
    },
    { 
      key: 'isActive', 
      header: 'Status', 
      render: (item: Template) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { key: 'lastModified', header: 'Last Modified', sortable: true }
  ];

  const canManageTemplates = profile?.role === 'admin';

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Template Management"
        subtitle="Manage patient education handout templates"
        actions={
          canManageTemplates ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Import Templates
              </Button>
              <Button variant="primary" size="sm">
                Create Template
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-handouts-primary">
              {templates.length}
            </div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Templates</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {templates.filter(t => t.digitalDeliveryEnabled).length}
            </div>
            <div className="text-sm text-gray-600">Digital Delivery</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {templates.reduce((sum, t) => sum + t.usageCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Usage (30d)</div>
          </div>
        </Card>
      </div>

      {/* Templates Table */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Handout Templates
          </h3>
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-handouts-primary focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>

        <DataTable
          data={filteredTemplates}
          columns={columns}
          onRowClick={(template) => {
            analytics.track('template_clicked', 'interaction', {
              template_id: template.id,
              template_name: template.name
            });
          }}
        />
      </Card>
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedTemplatesPage() {
  return (
    <AuthGuard level="staff" appName="handouts">
      <TemplatesPage />
    </AuthGuard>
  );
}