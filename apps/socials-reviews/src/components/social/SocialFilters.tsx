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
import { Slider } from '@/components/ui/placeholders';
import { Filter, X, Search, Calendar, Hash, TrendingUp } from 'lucide-react';
import type { FilterOptions } from '@/types';

interface SocialFiltersProps {
  filters: FilterOptions['social'];
  onFiltersChange: (filters: FilterOptions['social']) => void;
  onClearFilters: () => void;
  totalResults: number;
  className?: string;
}

export default function SocialFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  className = ''
}: SocialFiltersProps) {
  const updateFilter = <K extends keyof FilterOptions['social']>(
    key: K,
    value: FilterOptions['social'][K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters || {}).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    if (typeof value === 'number') return value > 0;
    return value !== undefined && value !== '';
  });

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters?.platform?.length) count++;
    if (filters?.performance_level?.length) count++;
    if (filters?.content_topics?.length) count++;
    if (filters?.competitor?.length) count++;
    if (filters?.date_range?.start || filters?.date_range?.end) count++;
    if (filters?.min_engagement) count++;
    return count;
  };

  const platformOptions = [
    { value: 'facebook', label: 'Facebook', color: 'primary' },
    { value: 'instagram', label: 'Instagram', color: 'secondary' },
    { value: 'twitter', label: 'Twitter', color: 'primary' },
    { value: 'linkedin', label: 'LinkedIn', color: 'primary' },
    { value: 'tiktok', label: 'TikTok', color: 'secondary' },
  ];

  const performanceOptions = [
    { value: 'high', label: 'High Performance' },
    { value: 'medium', label: 'Medium Performance' },
    { value: 'low', label: 'Low Performance' },
  ];

  const topicOptions = [
    { value: 'skincare', label: 'Skincare' },
    { value: 'acne_treatment', label: 'Acne Treatment' },
    { value: 'cosmetic_procedures', label: 'Cosmetic Procedures' },
    { value: 'sun_protection', label: 'Sun Protection' },
    { value: 'medical_dermatology', label: 'Medical Dermatology' },
    { value: 'patient_testimonials', label: 'Patient Testimonials' },
    { value: 'educational', label: 'Educational' },
    { value: 'before_after', label: 'Before/After' },
    { value: 'product_recommendations', label: 'Product Recommendations' },
    { value: 'seasonal_tips', label: 'Seasonal Tips' },
  ];

  const competitorOptions = [
    { value: 'detroit_dermatology', label: 'Detroit Dermatology' },
    { value: 'michigan_skin_care', label: 'Michigan Skin Care' },
    { value: 'advanced_dermatology', label: 'Advanced Dermatology' },
    { value: 'great_lakes_dermatology', label: 'Great Lakes Dermatology' },
    { value: 'dermatology_associates', label: 'Dermatology Associates' },
  ];

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search posts by caption or hashtags..."
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
            <div className="w-80 p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Platform Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <div className="space-y-2">
                  {platformOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.platform?.includes(option.value as 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok') || false}
                      onChange={(checked: boolean) => {
                        const currentPlatforms = filters?.platform || [];
                        const newPlatforms = checked
                          ? [...currentPlatforms, option.value as 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok']
                          : currentPlatforms.filter(p => p !== option.value);
                        updateFilter('platform', newPlatforms);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Performance Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  Performance Level
                </label>
                <div className="space-y-2">
                  {performanceOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.performance_level?.includes(option.value as 'high' | 'medium' | 'low') || false}
                      onChange={(checked: boolean) => {
                        const currentLevels = filters?.performance_level || [];
                        const newLevels = checked
                          ? [...currentLevels, option.value as 'high' | 'medium' | 'low']
                          : currentLevels.filter(l => l !== option.value);
                        updateFilter('performance_level', newLevels);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Content Topics Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Content Topics
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {topicOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.content_topics?.includes(option.value as 'skincare' | 'acne_treatment' | 'cosmetic_procedures' | 'sun_protection' | 'medical_dermatology' | 'patient_testimonials' | 'educational' | 'before_after' | 'product_recommendations' | 'seasonal_tips') || false}
                      onChange={(checked: boolean) => {
                        const currentTopics = filters?.content_topics || [];
                        const newTopics = checked
                          ? [...currentTopics, option.value as 'skincare' | 'acne_treatment' | 'cosmetic_procedures' | 'sun_protection' | 'medical_dermatology' | 'patient_testimonials' | 'educational' | 'before_after' | 'product_recommendations' | 'seasonal_tips']
                          : currentTopics.filter(t => t !== option.value);
                        updateFilter('content_topics', newTopics);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Competitor Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitor Account
                </label>
                <div className="space-y-2">
                  {competitorOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      label={option.label}
                      checked={filters?.competitor?.includes(option.value) || false}
                      onChange={(checked: boolean) => {
                        const currentCompetitors = filters?.competitor || [];
                        const newCompetitors = checked
                          ? [...currentCompetitors, option.value]
                          : currentCompetitors.filter(c => c !== option.value);
                        updateFilter('competitor', newCompetitors);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Minimum Engagement Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Engagement Rate
                </label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={10}
                    step={0.1}
                    value={[(filters?.min_engagement || 0) * 100]}
                    onValueChange={(value: number[]) => updateFilter('min_engagement', value[0] / 100)}
                    className="mb-2"
                  />
                  <div className="text-sm text-gray-600 text-center">
                    {((filters?.min_engagement || 0) * 100).toFixed(1)}%
                  </div>
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
                    onChange={(date: string) => updateFilter('date_range', {
                      ...filters?.date_range,
                      start: date
                    })}
                  />
                  <DatePicker
                    placeholder="End date"
                    value={filters?.date_range?.end || ''}
                    onChange={(date: string) => updateFilter('date_range', {
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
          
          {filters?.platform?.map((platform) => (
            <Badge
              key={platform}
              variant={(platformOptions.find(p => p.value === platform)?.color as 'primary' | 'secondary') || 'primary'}
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>{platformOptions.find(p => p.value === platform)?.label}</span>
              <button
                onClick={() => updateFilter('platform', 
                  filters.platform?.filter(p => p !== platform) || []
                )}
                className="ml-1 hover:bg-opacity-20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters?.performance_level?.map((level) => (
            <Badge
              key={level}
              variant="success"
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>{performanceOptions.find(p => p.value === level)?.label}</span>
              <button
                onClick={() => updateFilter('performance_level', 
                  filters.performance_level?.filter(l => l !== level) || []
                )}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters?.content_topics?.slice(0, 3).map((topic) => (
            <Badge
              key={topic}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>{topicOptions.find(t => t.value === topic)?.label}</span>
              <button
                onClick={() => updateFilter('content_topics', 
                  filters.content_topics?.filter(t => t !== topic) || []
                )}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {(filters?.content_topics?.length || 0) > 3 && (
            <Badge variant="secondary" size="sm">
              +{(filters?.content_topics?.length || 0) - 3} more topics
            </Badge>
          )}

          {filters?.min_engagement && filters.min_engagement > 0 && (
            <Badge
              variant="warning"
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>Min {(filters.min_engagement * 100).toFixed(1)}% engagement</span>
              <button
                onClick={() => updateFilter('min_engagement', 0)}
                className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {totalResults} post{totalResults !== 1 ? 's' : ''} found
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