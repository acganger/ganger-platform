import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-eos';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { supabase } from '@/lib/supabase';
import { Issue, CreateIssueForm } from '@/types/eos';
import Layout from '@/components/Layout';
import IssueCard from '@/components/issues/IssueCard';
import IssueForm from '@/components/issues/IssueForm';
import IssueFilters from '@/components/issues/IssueFilters';
import IDSBoard from '@/components/issues/IDSBoard';
import { 
  Plus, 
  Filter,
  LayoutGrid,
  List,
  Users,
  Activity
} from 'lucide-react';

interface IssuesPageProps {}

export default function IssuesPage({}: IssuesPageProps) {
  const { activeTeam, user } = useAuth();
  const { issues, loading, error } = useRealtimeData();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    owner: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter issues based on current filters and search
  const filteredIssues = issues.filter(issue => {
    if (filters.status !== 'all' && issue.status !== filters.status) return false;
    if (filters.priority !== 'all' && issue.priority !== filters.priority) return false;
    if (filters.type !== 'all' && issue.type !== filters.type) return false;
    if (filters.owner !== 'all' && issue.owner_id !== filters.owner) return false;
    if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group issues by status for board view
  const issuesByStatus = {
    identified: filteredIssues.filter(issue => issue.status === 'identified'),
    discussing: filteredIssues.filter(issue => issue.status === 'discussing'),
    solved: filteredIssues.filter(issue => issue.status === 'solved'),
    dropped: filteredIssues.filter(issue => issue.status === 'dropped')
  };

  const handleCreateIssue = async (formData: CreateIssueForm) => {
    if (!activeTeam || !user) return;

    try {
      const newIssue = {
        team_id: activeTeam.id,
        created_by: user.id,
        ...formData,
        status: 'identified' as const
      };

      const { error } = await supabase
        .from('issues')
        .insert([newIssue]);

      if (error) throw error;

      setShowForm(false);
    } catch (err) {
    }
  };

  const handleUpdateIssue = async (issueId: string, updates: Partial<Issue>) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', issueId);

      if (error) throw error;
    } catch (err) {
    }
  };

  const getPriorityStats = () => {
    const stats = {
      critical: filteredIssues.filter(i => i.priority === 'critical').length,
      high: filteredIssues.filter(i => i.priority === 'high').length,
      medium: filteredIssues.filter(i => i.priority === 'medium').length,
      low: filteredIssues.filter(i => i.priority === 'low').length
    };
    return stats;
  };

  const getStatusStats = () => {
    return {
      identified: issuesByStatus.identified.length,
      discussing: issuesByStatus.discussing.length,
      solved: issuesByStatus.solved.length,
      dropped: issuesByStatus.dropped.length
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading issues: {error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const priorityStats = getPriorityStats();
  const statusStats = getStatusStats();

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-gray-900">
              Issues ({filteredIssues.length})
            </h1>
            <div className="text-sm text-gray-500">
              IDS Methodology
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <Filter className="h-5 w-5 text-gray-600" />
              {Object.values(filters).some(f => f !== 'all') && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-eos-500 rounded-full" />
              )}
            </button>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1 rounded ${
                  viewMode === 'board' 
                    ? 'bg-white text-eos-600 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${
                  viewMode === 'list' 
                    ? 'bg-white text-eos-600 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="bg-eos-600 text-white p-2 rounded-lg hover:bg-eos-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Priority Distribution</span>
              <Activity className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-2 flex space-x-2">
              {priorityStats.critical > 0 && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                  {priorityStats.critical} Critical
                </span>
              )}
              {priorityStats.high > 0 && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                  {priorityStats.high} High
                </span>
              )}
              {priorityStats.medium > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                  {priorityStats.medium} Med
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status Overview</span>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <span className="text-gray-700">{statusStats.identified} New</span>
              <span className="text-blue-700">{statusStats.discussing} Discussing</span>
              <span className="text-green-700">{statusStats.solved} Solved</span>
              <span className="text-gray-500">{statusStats.dropped} Dropped</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <IssueFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'board' ? (
          <IDSBoard
            issuesByStatus={issuesByStatus}
            onUpdateIssue={handleUpdateIssue}
            onSelectIssue={setSelectedIssue}
          />
        ) : (
          <div className="p-4 space-y-3 overflow-y-auto">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
                <p className="text-gray-500 mb-4">
                  {Object.values(filters).some(f => f !== 'all') || searchQuery
                    ? 'No issues match your current filters.'
                    : 'Get started by identifying your first issue.'}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-eos-600 text-white px-4 py-2 rounded-lg hover:bg-eos-700 transition-colors"
                >
                  Create First Issue
                </button>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onUpdate={handleUpdateIssue}
                  onClick={() => setSelectedIssue(issue)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Issue Form Modal */}
      {showForm && (
        <IssueForm
          onSubmit={handleCreateIssue}
          onClose={() => setShowForm(false)}
        />
      )}
    </Layout>
  );
}
// Force SSR to prevent auth context issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}
export const runtime = 'edge';
