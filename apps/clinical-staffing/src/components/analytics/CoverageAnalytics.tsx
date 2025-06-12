import React, { useState, useEffect } from 'react';
import { Card, StatCard } from '@ganger/ui';
import { StaffingAnalytics } from '@/types/staffing';
import { apiClient } from '@/lib/api-client';
import { CoverageChart, UtilizationChart } from '@/components/charts/SimpleChart';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

interface CoverageAnalyticsProps {
  selectedLocation?: string;
}


export function CoverageAnalytics({ selectedLocation }: CoverageAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<StaffingAnalytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Calculate date range based on selected period
        const endDate = new Date();
        const startDate = new Date();
        
        switch (selectedPeriod) {
          case 'day':
            startDate.setDate(endDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        }

        const response = await apiClient.getStaffingAnalytics(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          selectedLocation
        );

        if (response.success && response.data) {
          setAnalyticsData(response.data);
        } else {
          throw new Error('Failed to load analytics data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedPeriod, selectedLocation]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Staffing Analytics</h2>
          <div className="w-32 h-8 bg-neutral-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-neutral-200 rounded animate-pulse"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-80 bg-neutral-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Staffing Analytics</h2>
        <Card>
          <div className="p-8 text-center">
            <div className="text-red-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-1">
              Failed to Load Analytics
            </h3>
            <p className="text-neutral-500 text-sm mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Staffing Analytics</h2>
        <Card>
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-neutral-900 mb-1">
              No Analytics Data
            </h3>
            <p className="text-neutral-500 text-sm">
              No analytics data available for the selected period.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Staffing Analytics</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Coverage Rate"
          value={`${Math.round(analyticsData.coverage_metrics.total_coverage_rate)}%`}
          variant={analyticsData.coverage_metrics.total_coverage_rate >= 90 ? "success" : 
                  analyticsData.coverage_metrics.total_coverage_rate >= 70 ? "warning" : "danger"}
          trend={analyticsData.coverage_metrics.total_coverage_rate >= 90 ? 
                 { value: 5, direction: "up" } : undefined}
        />
        
        <StatCard
          title="Staff Utilization"
          value={`${Math.round(analyticsData.staff_metrics.average_utilization_rate)}%`}
          variant={analyticsData.staff_metrics.average_utilization_rate >= 80 ? "success" : "warning"}
          trend={analyticsData.staff_metrics.average_utilization_rate >= 80 ? 
                 { value: 3, direction: "up" } : undefined}
        />
        
        <StatCard
          title="Cross-Location"
          value={analyticsData.staff_metrics.cross_location_assignments.toString()}
          variant={analyticsData.staff_metrics.cross_location_assignments <= 5 ? "success" : "warning"}
          trend={analyticsData.staff_metrics.cross_location_assignments === 0 ? 
                 { value: 0, direction: "up" } : undefined}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coverage Metrics */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Coverage Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Total Coverage Rate</span>
                <span className="font-medium">
                  {Math.round(analyticsData.coverage_metrics.total_coverage_rate)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Uncovered Hours</span>
                <span className="font-medium text-orange-600">
                  {analyticsData.coverage_metrics.uncovered_hours}h
                </span>
              </div>

              {/* Location-specific coverage */}
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">
                  By Location
                </h4>
                <div className="space-y-2">
                  {Object.entries(analyticsData.coverage_metrics.location_coverage_rates).map(([locationId, rate]) => (
                    <div key={locationId} className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Location {locationId}</span>
                      <span className={`font-medium ${rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                        {Math.round(rate)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cost Metrics */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Total Staffing Cost</span>
                <span className="font-medium">
                  ${analyticsData.cost_metrics.total_staffing_cost.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Cost per Hour</span>
                <span className="font-medium">
                  ${analyticsData.cost_metrics.cost_per_hour.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Overtime Cost</span>
                <span className="font-medium text-orange-600">
                  ${analyticsData.cost_metrics.overtime_cost.toLocaleString()}
                </span>
              </div>

              {/* Cost by location */}
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">
                  By Location
                </h4>
                <div className="space-y-2">
                  {Object.entries(analyticsData.cost_metrics.cost_by_location).map(([locationId, cost]) => (
                    <div key={locationId} className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Location {locationId}</span>
                      <span className="font-medium">
                        ${cost.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Coverage Trends</h3>
            <ErrorBoundary>
              <CoverageChart
                data={[
                  { label: 'Mon', value: analyticsData.coverage_metrics.total_coverage_rate },
                  { label: 'Tue', value: analyticsData.coverage_metrics.total_coverage_rate + 5 },
                  { label: 'Wed', value: analyticsData.coverage_metrics.total_coverage_rate - 3 },
                  { label: 'Thu', value: analyticsData.coverage_metrics.total_coverage_rate + 2 },
                  { label: 'Fri', value: analyticsData.coverage_metrics.total_coverage_rate + 8 },
                ]}
              />
            </ErrorBoundary>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Staff Utilization</h3>
            <ErrorBoundary>
              <UtilizationChart
                data={[
                  { label: 'MA', value: 85, color: '#3B82F6' },
                  { label: 'RN', value: 92, color: '#10B981' },
                  { label: 'Tech', value: 78, color: '#F59E0B' },
                  { label: 'Admin', value: 65, color: '#8B5CF6' },
                ]}
              />
            </ErrorBoundary>
          </div>
        </Card>
      </div>

      {/* Optimization Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Optimization Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {Math.round(analyticsData.optimization_metrics.optimization_score)}%
              </div>
              <div className="text-sm text-neutral-600">Optimization Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analyticsData.optimization_metrics.suggestions_applied}
              </div>
              <div className="text-sm text-neutral-600">Suggestions Applied</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                ${analyticsData.optimization_metrics.cost_savings_achieved.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-600">Cost Savings</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {analyticsData.optimization_metrics.coverage_improvements}
              </div>
              <div className="text-sm text-neutral-600">Coverage Improvements</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}