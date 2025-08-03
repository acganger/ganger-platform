'use client'

import { useState, useMemo } from 'react';
import { LoadingSpinner } from '@ganger/ui';
import { Card, Button } from '../ui/ComponentWrappers';
import { useCompliance } from '@/lib/compliance-context';
import { useRealtimeCompliance } from '@/hooks/useRealtimeCompliance';
import { ComplianceMatrix } from '@/components/matrix/ComplianceMatrix';
import { MobileComplianceMatrix } from '@/components/matrix/MobileComplianceMatrix';
import { MobileComplianceView } from '@/components/mobile/MobileComplianceView';
import { ResponsiveLayout, useResponsive } from '@/components/layout/ResponsiveLayout';
import { ComplianceFilters } from '@/components/filters/ComplianceFilters';
import { ComplianceStats } from '@/components/dashboard/ComplianceStats';
import { ComplianceChartsLazy as ComplianceCharts } from '@/components/charts/ComplianceChartsLazy';
import { ExportControls } from '@/components/exports/ExportControls';
import { SyncStatusIndicator } from '@/components/shared/SyncStatusIndicator';
import { QuickSearchPanel } from '@/components/search/QuickSearchPanel';
import { SavedSearches } from '@/components/search/SavedSearches';
import { RefreshCw, Filter, BarChart3, Download, Search, Bookmark, Zap } from 'lucide-react';
import type { FilterOptions } from '@/types/compliance';

export function ComplianceDashboard() {
  const { state, actions } = useCompliance();
  const realtimeStatus = useRealtimeCompliance();
  const { isMobile } = useResponsive();
  const [showFilters, setShowFilters] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(true);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Calculate filtered data based on current filters
  const filteredData = useMemo(() => {
    let filteredEmployees = state.employees;
    let filteredCompletions = state.completions;

    // Apply department filter
    if (state.filters.department !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.department === state.filters.department
      );
    }

    // Apply location filter
    if (state.filters.location !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.location === state.filters.location
      );
    }

    // Apply role filter
    if (state.filters.role && state.filters.role !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.role === state.filters.role
      );
    }

    // Apply search term filter
    if (state.filters.searchTerm) {
      const searchLower = state.filters.searchTerm.toLowerCase();
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.department.toLowerCase().includes(searchLower) ||
        emp.role.toLowerCase().includes(searchLower)
      );
    }

    // Filter completions to match filtered employees
    const employeeIds = new Set(filteredEmployees.map(emp => emp.id));
    filteredCompletions = filteredCompletions.filter(completion =>
      employeeIds.has(completion.employeeId)
    );

    // Apply status filter to completions
    if (state.filters.status !== 'all') {
      filteredCompletions = filteredCompletions.filter(completion =>
        completion.status === state.filters.status
      );
    }

    return {
      employees: filteredEmployees,
      trainings: state.trainings,
      completions: filteredCompletions
    };
  }, [state.employees, state.trainings, state.completions, state.filters]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await actions.triggerSync();
    } finally {
      setSyncing(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    actions.updateFilters(newFilters);
  };

  if (state.loading && state.employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  // Mobile version
  const mobileView = (
    <MobileComplianceView
      employees={filteredData.employees}
      trainings={filteredData.trainings}
      completions={filteredData.completions}
      filters={state.filters}
      onFilterChange={handleFilterChange}
      onRefresh={handleSync}
      onExport={() => {
        // Open export modal - you might want to create a simpler mobile export
        document.querySelector<HTMLButtonElement>('[data-export-button]')?.click();
      }}
    />
  );

  // Desktop version
  const desktopView = (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant={showQuickSearch ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowQuickSearch(!showQuickSearch)}
              leftIcon={<Zap className="h-4 w-4" />}
            >
              Quick Search
            </Button>
            
            <Button
              variant={showSavedSearches ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              leftIcon={<Bookmark className="h-4 w-4" />}
            >
              Saved Searches
            </Button>
            
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Advanced Filters
            </Button>
            
            <Button
              variant={showCharts ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowCharts(!showCharts)}
              leftIcon={<BarChart3 className="h-4 w-4" />}
            >
              Charts
            </Button>

            <div data-export-button>
              <ExportControls 
                filters={state.filters}
                data={filteredData}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <SyncStatusIndicator
              lastSync={realtimeStatus.lastUpdate || state.lastSync || undefined}
              isConnected={realtimeStatus.isConnected}
              isSyncing={realtimeStatus.isSyncing || syncing}
              error={realtimeStatus.error}
            />
            
            {realtimeStatus.updateCount > 0 && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                {realtimeStatus.updateCount} live updates
              </span>
            )}
            
            <Button
              variant="primary"
              size="sm"
              onClick={realtimeStatus.error ? realtimeStatus.reconnect : handleSync}
              disabled={syncing || realtimeStatus.isSyncing}
              leftIcon={<RefreshCw className={`h-4 w-4 ${(syncing || realtimeStatus.isSyncing) ? 'animate-spin' : ''}`} />}
            >
              {realtimeStatus.error ? 'Reconnect' : syncing || realtimeStatus.isSyncing ? 'Syncing...' : 'Sync Data'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Search Panel */}
      {showQuickSearch && (
        <QuickSearchPanel
          onFilterChange={handleFilterChange}
          currentFilters={state.filters}
          statsData={{
            overdueCount: filteredData.completions.filter(c => c.status === 'overdue').length,
            dueSoonCount: filteredData.completions.filter(c => c.status === 'due_soon').length,
            completedCount: filteredData.completions.filter(c => c.status === 'completed').length,
            notStartedCount: state.employees.length * state.trainings.length - filteredData.completions.length
          }}
        />
      )}

      {/* Saved Searches Panel */}
      {showSavedSearches && (
        <SavedSearches
          onApplySearch={handleFilterChange}
          currentFilters={state.filters}
        />
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <ComplianceFilters
          filters={state.filters}
          employees={state.employees}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Dashboard Stats */}
      <ComplianceStats
        employees={filteredData.employees}
        trainings={filteredData.trainings}
        completions={filteredData.completions}
      />

      {/* Charts Section */}
      {showCharts && (
        <ComplianceCharts
          employees={filteredData.employees}
          trainings={filteredData.trainings}
          completions={filteredData.completions}
        />
      )}

      {/* Main Compliance Matrix */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Compliance Matrix
              </h2>
              <p className="text-sm text-gray-600">
                {filteredData.employees.length} employees × {filteredData.trainings.length} training modules
              </p>
            </div>
            
            {state.filters.status !== 'all' && (
              <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Filtered by: {state.filters.status.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>

        {isMobile ? (
          <MobileComplianceMatrix
            employees={filteredData.employees}
            trainings={filteredData.trainings}
            completions={filteredData.completions}
            loading={state.loading}
          />
        ) : (
          <ComplianceMatrix
            employees={filteredData.employees}
            trainings={filteredData.trainings}
            completions={filteredData.completions}
            loading={state.loading}
          />
        )}
      </Card>

      {/* No Data State */}
      {filteredData.employees.length === 0 && !state.loading && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No employees found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or sync data to see compliance information.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              actions.updateFilters({
                status: 'all',
                department: 'all',
                location: 'all',
                timeRange: 'current'
              });
            }}
          >
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );

  return (
    <ResponsiveLayout
      mobileComponent={mobileView}
      breakpoint={768}
    >
      {desktopView}
    </ResponsiveLayout>
  );
}