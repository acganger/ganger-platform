import React, { useState, useEffect } from 'react';
import { Button, StatCard } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { StaffMember, StaffSchedule, Location as StaffingLocation, OptimizationSuggestion, CoverageMetrics } from '@/types/staffing';
import { formatDate } from '@/utils/formatting';
import { apiClient } from '@/lib/api-client';
import { StaffCard } from './StaffCard';

interface StaffingSidebarProps {
  staffMembers: StaffMember[];
  schedules: StaffSchedule[];
  selectedDate: Date;
  selectedLocation: string;
  locations: StaffingLocation[];
  onLocationChange: (locationId: string) => void;
  onDateChange: (date: Date) => void;
}

export function StaffingSidebar({ 
  staffMembers, 
  schedules, 
  selectedDate,
  selectedLocation,
  locations,
  onLocationChange,
  onDateChange
}: StaffingSidebarProps) {
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [coverageMetrics, setCoverageMetrics] = useState<CoverageMetrics | null>(null);

  // Calculate coverage metrics
  useEffect(() => {
    const calculateMetrics = () => {
      const dateString = formatDate(selectedDate);
      const todaySchedules = schedules.filter(s => s.schedule_date === dateString);
      
      // Get total required staff positions for the day
      const providers = schedules.reduce((acc: Array<{ id: string; requires_staff_count: number }>, schedule: any) => {
        if (!acc.some(p => p.id === schedule.provider_id)) {
          acc.push({ id: schedule.provider_id, requires_staff_count: 1 }); // Simplified
        }
        return acc;
      }, [] as Array<{ id: string; requires_staff_count: number }>);
      
      const totalRequiredPositions = providers.length;
      const coveredPositions = todaySchedules.length;
      const coverageRate = totalRequiredPositions > 0 ? (coveredPositions / totalRequiredPositions) * 100 : 0;
      
      // Count cross-location assignments
      const crossLocationCount = todaySchedules.filter(schedule => {
        const staff = staffMembers.find(s => s.id === schedule.staff_member_id);
        return staff && !staff.location_preferences.includes(schedule.location_id);
      }).length;
      
      // Calculate optimal assignments (simplified)
      const optimalAssignments = todaySchedules.filter(schedule => {
        const staff = staffMembers.find(s => s.id === schedule.staff_member_id);
        return staff && staff.location_preferences.includes(schedule.location_id);
      }).length;
      
      const optimalPercentage = todaySchedules.length > 0 ? (optimalAssignments / todaySchedules.length) * 100 : 0;
      
      setCoverageMetrics({
        coverage_rate: Math.round(coverageRate),
        optimal_assignments: Math.round(optimalPercentage),
        cross_location_count: crossLocationCount,
        uncovered_slots: Math.max(0, totalRequiredPositions - coveredPositions),
      });
    };

    calculateMetrics();
  }, [schedules, selectedDate, staffMembers]);

  // Load optimization suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!selectedLocation) return;
      
      setIsLoadingSuggestions(true);
      try {
        const response = await apiClient.getOptimizationSuggestions(
          formatDate(selectedDate),
          selectedLocation
        );
        
        if (response.success && response.data) {
          setOptimizationSuggestions(response.data);
        }
      } catch (error) {
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, [selectedDate, selectedLocation]);

  const applySuggestion = async (suggestion: OptimizationSuggestion) => {
    try {
      const response = await apiClient.applyOptimizationSuggestion(suggestion.id);
      
      if (response.success) {
        // Remove applied suggestion from list
        setOptimizationSuggestions(prev => 
          prev.filter(s => s.id !== suggestion.id)
        );
        
        // Refresh the page to show updated schedules
        window.location.reload();
      }
    } catch (error) {
    }
  };

  const getAvailableStaff = () => {
    const dateString = formatDate(selectedDate);
    return staffMembers.filter(staff => {
      // Check if staff is already assigned
      const isAssigned = schedules.some(s => 
        s.staff_member_id === staff.id && s.schedule_date === dateString
      );
      
      // Check if staff is unavailable
      const isUnavailable = staff.unavailable_dates.includes(dateString);
      
      return !isAssigned && !isUnavailable && staff.is_active;
    });
  };

  const locationOptions = locations.map(location => ({
    value: location.id,
    label: location.name,
  }));

  const availableStaff = getAvailableStaff();

  return (
    <div className="space-y-6">
      {/* Location Selector */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Filter by Location</h3>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
          >
            <option value="">All Locations</option>
            {locationOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Coverage Metrics */}
      {coverageMetrics && (
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Coverage Status</h3>
            <div className="space-y-3">
              <StatCard
                title="Coverage Rate"
                value={`${coverageMetrics.coverage_rate}%`}
                variant={coverageMetrics.coverage_rate >= 90 ? "success" : coverageMetrics.coverage_rate >= 70 ? "warning" : "danger"}
                trend={coverageMetrics.coverage_rate >= 90 ? { value: 5, direction: "up" } : undefined}
              />
              <StatCard
                title="Optimal Assignments"
                value={`${coverageMetrics.optimal_assignments}%`}
                variant={coverageMetrics.optimal_assignments >= 80 ? "success" : "warning"}
                trend={coverageMetrics.optimal_assignments >= 80 ? { value: 3, direction: "up" } : undefined}
              />
              <StatCard
                title="Cross-Location"
                value={coverageMetrics.cross_location_count.toString()}
                variant={coverageMetrics.cross_location_count <= 2 ? "success" : "warning"}
                trend={coverageMetrics.cross_location_count === 0 ? { value: 0, direction: "up" } : undefined}
              />
              {coverageMetrics.uncovered_slots > 0 && (
                <StatCard
                  title="Uncovered Slots"
                  value={coverageMetrics.uncovered_slots.toString()}
                  variant="danger"
                  trend={{ value: coverageMetrics.uncovered_slots, direction: "down" }}
                />
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Available Staff */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            Available Staff ({availableStaff.length})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {availableStaff.length === 0 ? (
              <div className="text-center text-neutral-500 py-4">
                <p>No available staff</p>
                <p className="text-sm mt-1">All staff members are assigned or unavailable</p>
              </div>
            ) : (
              availableStaff.map(staff => (
                <StaffCard 
                  key={staff.id}
                  staff={staff}
                  showAssignment={true}
                  compact={true}
                  status="available"
                />
              ))
            )}
          </div>
        </div>
      </Card>

      {/* AI Optimization Suggestions */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">AI Suggestions</h3>
          
          {isLoadingSuggestions ? (
            <div className="text-center py-4">
              <div className="animate-spin h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-sm text-neutral-500 mt-2">Loading suggestions...</p>
            </div>
          ) : optimizationSuggestions.length === 0 ? (
            <div className="text-center text-neutral-500 py-4">
              <p>No suggestions available</p>
              <p className="text-sm mt-1">Current schedule looks optimal</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {optimizationSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-900">
                      {suggestion.title}
                    </h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {Math.round(suggestion.confidence_level * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">
                    {suggestion.description}
                  </p>
                  {suggestion.cost_savings && suggestion.cost_savings > 0 && (
                    <p className="text-xs text-green-700 mb-2">
                      💰 Potential savings: ${suggestion.cost_savings}
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    Apply Suggestion
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Refresh Data
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                const tomorrow = new Date(selectedDate);
                tomorrow.setDate(tomorrow.getDate() + 1);
                onDateChange(tomorrow);
              }}
            >
              View Tomorrow
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                if (selectedLocation) {
                  apiClient.autoAssignStaff(
                    formatDate(selectedDate),
                    selectedLocation
                  ).then(() => {
                    window.location.reload();
                  });
                }
              }}
              disabled={!selectedLocation}
            >
              Auto-Assign Staff
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}