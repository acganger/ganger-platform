'use client'

import React from 'react';
import { 
  Button, 
  Badge
} from '@ganger/ui';
import { 
  Input, 
  DatePicker,
  Checkbox,
  DropdownMenu
} from '@/components/ui/placeholders';
import { Filter, X, Search, Calendar, MapPin, Star } from 'lucide-react';
import type { FilterOptions } from '@/types';

interface ReviewFiltersProps {
  filters: FilterOptions['reviews'];
  onFiltersChange: (filters: FilterOptions['reviews']) => void;
  onClearFilters: () => void;
  totalResults: number;
  className?: string;
}

export default function ReviewFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  className = ''
}: ReviewFiltersProps) {
  const updateFilter = <K extends keyof FilterOptions['reviews']>(
    key: K,
    value: FilterOptions['reviews'][K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters || {}).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined && value !== '';
  });

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters?.location?.length) count++;
    if (filters?.sentiment?.length) count++;
    if (filters?.urgency?.length) count++;
    if (filters?.status?.length) count++;
    if (filters?.rating?.length) count++;
    if (filters?.date_range?.start || filters?.date_range?.end) count++;
    return count;
  };

  const locationOptions = [
    { value: 'ann_arbor', label: 'Ann Arbor' },
    { value: 'plymouth', label: 'Plymouth' },
    { value: 'wixom', label: 'Wixom' },
  ];

  const sentimentOptions = [
    { value: 'positive', label: 'Positive' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'negative', label: 'Negative' },
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'responded', label: 'Responded' },
    { value: 'archived', label: 'Archived' },
  ];

  const ratingOptions = [
    { value: 1, label: '1 Star' },
    { value: 2, label: '2 Stars' },
    { value: 3, label: '3 Stars' },
    { value: 4, label: '4 Stars' },
    { value: 5, label: '5 Stars' },
  ];

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reviews by reviewer name or content..."
            className="pl-10"
          />
        </div>
        <DropdownMenu
          trigger={
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <Badge variant="primary" size="sm">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          }
          content={
            <div className="w-80 p-4 space-y-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location
                </label>
                <div className="space-y-2">
                  {locationOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.location?.includes(option.value as 'ann_arbor' | 'plymouth' | 'wixom') || false}
                      onChange={(checked) => {
                        const currentLocations = filters?.location || [];
                        const newLocations = checked
                          ? [...currentLocations, option.value as 'ann_arbor' | 'plymouth' | 'wixom']
                          : currentLocations.filter(l => l !== option.value);
                        updateFilter('location', newLocations);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Sentiment Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentiment
                </label>
                <div className="space-y-2">
                  {sentimentOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.sentiment?.includes(option.value as 'positive' | 'negative' | 'neutral') || false}
                      onChange={(checked) => {
                        const currentSentiments = filters?.sentiment || [];
                        const newSentiments = checked
                          ? [...currentSentiments, option.value as 'positive' | 'negative' | 'neutral']
                          : currentSentiments.filter(s => s !== option.value);
                        updateFilter('sentiment', newSentiments);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="inline h-4 w-4 mr-1" />
                  Rating
                </label>
                <div className="space-y-2">
                  {ratingOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.rating?.includes(option.value) || false}
                      onChange={(checked) => {
                        const currentRatings = filters?.rating || [];
                        const newRatings = checked
                          ? [...currentRatings, option.value]
                          : currentRatings.filter(r => r !== option.value);
                        updateFilter('rating', newRatings);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Urgency Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <div className="space-y-2">
                  {urgencyOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.urgency?.includes(option.value as 'low' | 'medium' | 'high' | 'critical') || false}
                      onChange={(checked) => {
                        const currentUrgency = filters?.urgency || [];
                        const newUrgency = checked
                          ? [...currentUrgency, option.value as 'low' | 'medium' | 'high' | 'critical']
                          : currentUrgency.filter(u => u !== option.value);
                        updateFilter('urgency', newUrgency);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.status?.includes(option.value as 'new' | 'in_progress' | 'responded' | 'archived') || false}
                      onChange={(checked) => {
                        const currentStatus = filters?.status || [];
                        const newStatus = checked
                          ? [...currentStatus, option.value as 'new' | 'in_progress' | 'responded' | 'archived']
                          : currentStatus.filter(s => s !== option.value);
                        updateFilter('status', newStatus);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    placeholder="Start date"
                    value={filters?.date_range?.start || ''}
                    onChange={(date) => updateFilter('date_range', {
                      ...filters?.date_range,
                      start: date
                    })}
                  />
                  <DatePicker
                    placeholder="End date"
                    value={filters?.date_range?.end || ''}
                    onChange={(date) => updateFilter('date_range', {
                      ...filters?.date_range,
                      end: date
                    })}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearFilters}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear All Filters</span>
                  </Button>
                </div>
              )}
            </div>
          }
        />
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          
          {filters?.location?.map((location) => (
            <Badge
              key={location}
              variant="blue"
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>{locationOptions.find(l => l.value === location)?.label}</span>
              <button
                onClick={() => updateFilter('location', 
                  filters.location?.filter(l => l !== location) || []
                )}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters?.sentiment?.map((sentiment) => (
            <Badge
              key={sentiment}
              variant="green"
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>{sentiment}</span>
              <button
                onClick={() => updateFilter('sentiment', 
                  filters.sentiment?.filter(s => s !== sentiment) || []
                )}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters?.rating?.map((rating) => (
            <Badge
              key={rating}
              variant="yellow"
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>{rating} star{rating !== 1 ? 's' : ''}</span>
              <button
                onClick={() => updateFilter('rating', 
                  filters.rating?.filter(r => r !== rating) || []
                )}
                className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {totalResults} review{totalResults !== 1 ? 's' : ''} found
          {hasActiveFilters && ' (filtered)'}
        </span>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-primary-600 hover:text-primary-700"
          >
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}