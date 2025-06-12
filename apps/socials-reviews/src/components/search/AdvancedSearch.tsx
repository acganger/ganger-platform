'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Badge, Select } from '@/components/ui/MockComponents';
import { Search, X, Filter, Save, History, Zap } from 'lucide-react';
import { useDebounce } from '@/hooks/usePerformanceOptimization';
import { validateSearchQuery } from '@/utils/validation';

interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between';
  value: string | number | [string | number, string | number];
  label: string;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter[];
  createdAt: string;
  lastUsed: string;
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilter[]) => void;
  onClear: () => void;
  placeholder?: string;
  searchFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: Array<{ value: string; label: string }>;
  }>;
  className?: string;
}

export default function AdvancedSearch({
  onSearch,
  onClear,
  placeholder = 'Search...',
  searchFields,
  className = ''
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string>('');

  // Debounced search to improve performance
  const debouncedSearch = useDebounce((searchQuery: string, searchFilters: SearchFilter[]) => {
    // Validate search query
    const validation = validateSearchQuery(searchQuery);
    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
      return;
    }
    
    setValidationError('');
    onSearch(validation.sanitizedValue || '', searchFilters);
    
    // Add to search history
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)]); // Keep last 10 searches
    }
  }, 300);

  // Trigger search when query or filters change
  useEffect(() => {
    debouncedSearch(query, filters);
  }, [query, filters, debouncedSearch]);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('socials-reviews-saved-searches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        // Failed to load saved searches
        void error;
      }
    }

    const history = localStorage.getItem('socials-reviews-search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        // Failed to load search history
        void error;
      }
    }
  }, []);

  // Save to localStorage when searches change
  useEffect(() => {
    localStorage.setItem('socials-reviews-saved-searches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  useEffect(() => {
    localStorage.setItem('socials-reviews-search-history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const handleAddFilter = useCallback(() => {
    const newFilter: SearchFilter = {
      field: searchFields[0]?.key || 'text',
      operator: 'contains',
      value: '',
      label: '',
    };
    setFilters(prev => [...prev, newFilter]);
  }, [searchFields]);

  const handleRemoveFilter = useCallback((index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateFilter = useCallback((index: number, updates: Partial<SearchFilter>) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ));
  }, []);

  const handleSaveSearch = useCallback(() => {
    if (!query.trim() && filters.length === 0) return;

    const name = prompt('Enter a name for this search:');
    if (!name) return;

    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: name.trim(),
      query,
      filters,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    setSavedSearches(prev => [savedSearch, ...prev.slice(0, 19)]); // Keep last 20 searches
  }, [query, filters]);

  const handleLoadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setShowSaved(false);

    // Update last used
    setSavedSearches(prev => prev.map(search => 
      search.id === savedSearch.id 
        ? { ...search, lastUsed: new Date().toISOString() }
        : search
    ));
  }, []);

  const handleDeleteSavedSearch = useCallback((searchId: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setFilters([]);
    setValidationError('');
    onClear();
  }, [onClear]);

  const handleHistorySelect = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    setShowSaved(false);
  }, []);

  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case 'number':
      case 'date':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greater_than', label: 'Greater than' },
          { value: 'less_than', label: 'Less than' },
          { value: 'between', label: 'Between' },
        ];
      case 'select':
        return [
          { value: 'equals', label: 'Equals' },
        ];
      default:
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
          { value: 'starts_with', label: 'Starts with' },
          { value: 'ends_with', label: 'Ends with' },
        ];
    }
  };

  const activeFiltersCount = filters.filter(f => f.value !== '').length;
  const hasActiveSearch = query.trim() || activeFiltersCount > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-20"
              aria-label="Search query"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Search history and saved searches"
              >
                <History className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2"
            aria-label="Toggle advanced filters"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="primary" size="sm">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {hasActiveSearch && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center space-x-2"
              aria-label="Clear all search and filters"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-2 text-sm text-red-600">
            {validationError}
          </div>
        )}

        {/* Search History & Saved Searches Dropdown */}
        {showSaved && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="p-2 border-b">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h4>
                {searchHistory.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistorySelect(historyQuery)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center space-x-2"
                  >
                    <History className="h-3 w-3" />
                    <span className="truncate">{historyQuery}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Searches</h4>
                {savedSearches.map((savedSearch) => (
                  <div key={savedSearch.id} className="flex items-center justify-between py-1">
                    <button
                      onClick={() => handleLoadSavedSearch(savedSearch)}
                      className="flex-1 text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center space-x-2"
                    >
                      <Save className="h-3 w-3" />
                      <span className="truncate">{savedSearch.name}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSavedSearch(savedSearch.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      aria-label={`Delete saved search: ${savedSearch.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchHistory.length === 0 && savedSearches.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No search history or saved searches
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              {hasActiveSearch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveSearch}
                  className="flex items-center space-x-1"
                >
                  <Save className="h-3 w-3" />
                  <span>Save</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddFilter}
                className="flex items-center space-x-1"
              >
                <Filter className="h-3 w-3" />
                <span>Add Filter</span>
              </Button>
            </div>
          </div>

          {/* Filter List */}
          {filters.map((filter, index) => {
            const field = searchFields.find(f => f.key === filter.field);
            const operatorOptions = getOperatorOptions(field?.type || 'text');

            return (
              <div key={index} className="flex items-center space-x-2 bg-white p-3 rounded border">
                <Select
                  value={filter.field}
                  onChange={(value) => handleUpdateFilter(index, { field: value })}
                  options={searchFields.map(f => ({ value: f.key, label: f.label }))}
                  className="w-32"
                />

                <Select
                  value={filter.operator}
                  onChange={(value) => handleUpdateFilter(index, { operator: value as 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' })}
                  options={operatorOptions}
                  className="w-32"
                />

                {filter.operator === 'between' ? (
                  <div className="flex items-center space-x-1">
                    <Input
                      type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                      placeholder="From"
                      value={Array.isArray(filter.value) ? filter.value[0] : ''}
                      onChange={(e) => handleUpdateFilter(index, { 
                        value: [e.target.value, Array.isArray(filter.value) ? filter.value[1] : ''] 
                      })}
                      className="w-24"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                      placeholder="To"
                      value={Array.isArray(filter.value) ? filter.value[1] : ''}
                      onChange={(e) => handleUpdateFilter(index, { 
                        value: [Array.isArray(filter.value) ? filter.value[0] : '', e.target.value] 
                      })}
                      className="w-24"
                    />
                  </div>
                ) : field?.type === 'select' ? (
                  <Select
                    value={typeof filter.value === 'string' ? filter.value : ''}
                    onChange={(value) => handleUpdateFilter(index, { value })}
                    options={field.options || []}
                    placeholder="Select value"
                    className="flex-1"
                  />
                ) : (
                  <Input
                    type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                    placeholder="Enter value"
                    value={typeof filter.value === 'string' ? filter.value : ''}
                    onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                    className="flex-1"
                  />
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFilter(index)}
                  className="flex items-center space-x-1"
                  aria-label="Remove filter"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}

          {filters.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No filters added. Click &quot;Add Filter&quot; to create advanced search criteria.
            </div>
          )}
        </div>
      )}

      {/* Quick Filter Shortcuts */}
      <div className="flex items-center space-x-2 flex-wrap">
        <span className="text-sm text-gray-600">Quick filters:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters([{ field: 'urgency_level', operator: 'equals', value: 'high', label: 'High urgency' }])}
          className="flex items-center space-x-1"
        >
          <Zap className="h-3 w-3" />
          <span>Urgent</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters([{ field: 'status', operator: 'equals', value: 'pending', label: 'Pending status' }])}
          className="flex items-center space-x-1"
        >
          <span>Pending</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters([{ field: 'is_high_performing', operator: 'equals', value: 'true', label: 'High performing' }])}
          className="flex items-center space-x-1"
        >
          <TrendingUp className="h-3 w-3" />
          <span>High Performance</span>
        </Button>
      </div>
    </div>
  );
}

// Add missing import
import { TrendingUp } from 'lucide-react';