'use client'

import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Input } from '../ui/ComponentWrappers';
import { 
  Save, 
  Bookmark, 
  Trash2, 
  Edit, 
  Star, 
  Search,
  Filter,
  X
} from 'lucide-react';
import type { FilterOptions } from '@/types/compliance';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: FilterOptions;
  createdAt: Date;
  lastUsed?: Date;
  isFavorite: boolean;
  useCount: number;
}

interface SavedSearchesProps {
  onApplySearch: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const STORAGE_KEY = 'compliance-saved-searches';

export function SavedSearches({ 
  onApplySearch, 
  currentFilters 
}: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        const searches = parsed.map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt),
          lastUsed: search.lastUsed ? new Date(search.lastUsed) : undefined
        }));
        setSavedSearches(searches);
      }
    } catch (error) {
    }
  }, []);

  // Save to localStorage whenever savedSearches changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches));
    } catch (error) {
    }
  }, [savedSearches]);

  const hasActiveFilters = () => {
    return (
      currentFilters.status !== 'all' ||
      currentFilters.department !== 'all' ||
      currentFilters.location !== 'all' ||
      currentFilters.role !== 'all' ||
      currentFilters.timeRange !== 'current' ||
      !!currentFilters.searchTerm
    );
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      description: searchDescription.trim() || undefined,
      filters: { ...currentFilters },
      createdAt: new Date(),
      isFavorite: false,
      useCount: 0
    };

    setSavedSearches(prev => [newSearch, ...prev]);
    setSearchName('');
    setSearchDescription('');
    setShowSaveModal(false);
  };

  const handleUpdateSearch = () => {
    if (!editingSearch || !searchName.trim()) return;

    setSavedSearches(prev => prev.map(search => 
      search.id === editingSearch.id
        ? {
            ...search,
            name: searchName.trim(),
            description: searchDescription.trim() || undefined,
            filters: { ...currentFilters }
          }
        : search
    ));

    setEditingSearch(null);
    setSearchName('');
    setSearchDescription('');
    setShowSaveModal(false);
  };

  const handleApplySearch = (search: SavedSearch) => {
    // Update use count and last used
    setSavedSearches(prev => prev.map(s => 
      s.id === search.id
        ? {
            ...s,
            useCount: s.useCount + 1,
            lastUsed: new Date()
          }
        : s
    ));

    onApplySearch(search.filters);
  };

  const handleDeleteSearch = (searchId: string) => {
    setSavedSearches(prev => prev.filter(s => s.id !== searchId));
  };

  const handleToggleFavorite = (searchId: string) => {
    setSavedSearches(prev => prev.map(search => 
      search.id === searchId
        ? { ...search, isFavorite: !search.isFavorite }
        : search
    ));
  };

  const handleEditSearch = (search: SavedSearch) => {
    setEditingSearch(search);
    setSearchName(search.name);
    setSearchDescription(search.description || '');
    setShowSaveModal(true);
  };

  const getFilterSummary = (filters: FilterOptions): string => {
    const parts: string[] = [];
    
    if (filters.status !== 'all') {
      parts.push(`Status: ${filters.status.replace('_', ' ')}`);
    }
    if (filters.department !== 'all') {
      parts.push(`Dept: ${filters.department}`);
    }
    if (filters.location !== 'all') {
      parts.push(`Location: ${filters.location}`);
    }
    if (filters.role && filters.role !== 'all') {
      parts.push(`Role: ${filters.role}`);
    }
    if (filters.searchTerm) {
      parts.push(`Search: "${filters.searchTerm}"`);
    }
    if (filters.timeRange !== 'current') {
      parts.push(`Time: ${filters.timeRange.replace('_', ' ')}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No filters';
  };

  const sortedSearches = [...savedSearches].sort((a, b) => {
    // Favorites first, then by last used, then by creation date
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    
    if (a.lastUsed && b.lastUsed) {
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    }
    if (a.lastUsed && !b.lastUsed) return -1;
    if (!a.lastUsed && b.lastUsed) return 1;
    
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Saved Searches</h3>
            {savedSearches.length > 0 && (
              <span className="text-xs text-gray-500">({savedSearches.length})</span>
            )}
          </div>
          
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveModal(true)}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Current
            </Button>
          )}
        </div>

        {sortedSearches.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No saved searches yet</p>
            <p className="text-xs mt-1">Apply filters and save them for quick access</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sortedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApplySearch(search)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center space-x-2">
                        {search.isFavorite && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {search.name}
                        </span>
                      </div>
                      
                      {search.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {search.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {getFilterSummary(search.filters)}
                      </p>
                      
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                        <span>Used {search.useCount} times</span>
                        {search.lastUsed && (
                          <span>Last: {search.lastUsed.toLocaleDateString()}</span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggleFavorite(search.id)}
                    className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    title={search.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`h-4 w-4 ${search.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={() => handleEditSearch(search)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit search"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteSearch(search.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete search"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Save/Edit Search Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setEditingSearch(null);
          setSearchName('');
          setSearchDescription('');
        }}
        title={editingSearch ? 'Edit Saved Search' : 'Save Current Search'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Name *
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., Overdue Ann Arbor Training"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={searchDescription}
              onChange={(e) => setSearchDescription(e.target.value)}
              placeholder="Brief description of what this search finds..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Filters:
            </label>
            <p className="text-sm text-gray-600">
              {getFilterSummary(currentFilters)}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveModal(false);
                setEditingSearch(null);
                setSearchName('');
                setSearchDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={editingSearch ? handleUpdateSearch : handleSaveSearch}
              disabled={!searchName.trim()}
            >
              {editingSearch ? 'Update Search' : 'Save Search'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}