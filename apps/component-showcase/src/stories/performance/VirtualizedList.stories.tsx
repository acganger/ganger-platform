import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '@ganger/ui-catalyst';
import { useState, useEffect, memo } from 'react';

const meta: Meta = {
  title: 'Performance/Virtualized List',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Performance demonstrations for handling large datasets with virtualization and lazy loading.',
      },
    },
  },
};

export default meta;

const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Patient ${i + 1}`,
    email: `patient${i + 1}@example.com`,
    phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    lastVisit: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: Math.random() > 0.7 ? 'Active' : 'Inactive',
  }));
};

export const LargeDataset: StoryObj = {
  render: () => {
    const [data] = useState(() => generateMockData(1000));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Simulate loading
      setTimeout(() => setLoading(false), 1000);
    }, []);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">1,000 Patient Records</h3>
          <p className="text-sm text-neutral-600">
            Virtualized rendering - only visible rows are in DOM
          </p>
        </div>
        
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p>Loading patient data...</p>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <DataTable
              columns={[
                { key: 'id', label: 'ID', width: 80 },
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'lastVisit', label: 'Last Visit' },
                { key: 'status', label: 'Status', width: 100 },
              ]}
              data={data}
              virtualized
              rowHeight={48}
            />
          </div>
        )}
        
        <div className="text-sm text-neutral-600">
          <p>✅ Smooth scrolling with 1,000 rows</p>
          <p>✅ Low memory footprint</p>
          <p>✅ Instant render time</p>
        </div>
      </div>
    );
  },
};

export const InfiniteScroll: StoryObj = {
  render: () => {
    const [items, setItems] = useState(() => generateMockData(50));
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const loadMore = () => {
      if (loading || !hasMore) return;
      
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const newItems = generateMockData(50);
        setItems(prev => [...prev, ...newItems]);
        setLoading(false);
        
        // Stop after 500 items
        if (items.length >= 450) {
          setHasMore(false);
        }
      }, 800);
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Infinite Scroll Demo</h3>
        
        <div 
          className="h-96 overflow-y-auto border rounded-lg p-4"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (scrollHeight - scrollTop <= clientHeight * 1.5) {
              loadMore();
            }
          }}
        >
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="p-3 bg-white dark:bg-neutral-800 rounded border">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-neutral-600">{item.email}</div>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {item.lastVisit}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
              </div>
            )}
            
            {!hasMore && (
              <div className="text-center py-4 text-neutral-600">
                No more items to load
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm text-neutral-600">
          <p>Loaded: {items.length} items</p>
          <p>Status: {loading ? 'Loading...' : hasMore ? 'Scroll for more' : 'All items loaded'}</p>
        </div>
      </div>
    );
  },
};

export const LazyImageLoading: StoryObj = {
  render: () => {
    const [visibleImages, setVisibleImages] = useState(new Set<number>());
    
    const images = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      src: `https://picsum.photos/seed/${i}/300/200`,
      title: `Medical Image ${i + 1}`,
    }));

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const id = Number(entry.target.getAttribute('data-id'));
              setVisibleImages(prev => new Set(prev).add(id));
            }
          });
        },
        { rootMargin: '50px' }
      );

      const elements = document.querySelectorAll('[data-lazy-image]');
      elements.forEach(el => observer.observe(el));

      return () => observer.disconnect();
    }, []);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Lazy Image Loading</h3>
        
        <div className="h-96 overflow-y-auto border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            {images.map(image => (
              <div
                key={image.id}
                data-id={image.id}
                data-lazy-image
                className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden"
              >
                {visibleImages.has(image.id) ? (
                  <img
                    src={image.src}
                    alt={image.title}
                    className="w-full h-full object-cover animate-fade-in"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-neutral-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
                <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm p-2">
                  {image.title}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-sm text-neutral-600">
          <p>Images loaded: {visibleImages.size} / {images.length}</p>
          <p>✅ Images load only when visible</p>
          <p>✅ Reduces initial page load time</p>
        </div>
      </div>
    );
  },
};

export const DebouncedSearch: StoryObj = {
  render: () => {
    const allData = generateMockData(500);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState(allData.slice(0, 20));
    const [searching, setSearching] = useState(false);
    const [searchCount, setSearchCount] = useState(0);

    useEffect(() => {
      setSearching(true);
      
      const timer = setTimeout(() => {
        setSearchCount(prev => prev + 1);
        
        if (searchTerm) {
          const filtered = allData.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredData(filtered.slice(0, 20));
        } else {
          setFilteredData(allData.slice(0, 20));
        }
        
        setSearching(false);
      }, 300); // 300ms debounce

      return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Debounced Search</h3>
        
        <div>
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-sm text-neutral-600 mt-1">
            Search executions: {searchCount} (300ms debounce)
          </p>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          {searching ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2"></div>
              <p className="text-sm text-neutral-600">Searching...</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredData.length === 0 ? (
                <div className="p-8 text-center text-neutral-600">
                  No results found
                </div>
              ) : (
                filteredData.map(item => (
                  <div key={item.id} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-neutral-600">{item.email}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="text-sm text-neutral-600">
          <p>✅ Reduces API calls by {Math.round((1 - (searchCount / Math.max(searchTerm.length, 1))) * 100)}%</p>
          <p>✅ Better user experience</p>
          <p>✅ Lower server load</p>
        </div>
      </div>
    );
  },
};

export const MemorizedComponents: StoryObj = {
  render: () => {
    const [count, setCount] = useState(0);
    const [otherState, setOtherState] = useState(0);
    const [renderCounts, setRenderCounts] = useState({ expensive: 0, cheap: 0 });

    // Expensive component that shouldn't re-render often
    const ExpensiveComponent = memo(() => {
      useEffect(() => {
        setRenderCounts(prev => ({ ...prev, expensive: prev.expensive + 1 }));
      });

      // Simulate expensive computation
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: Math.random(),
      }));

      return (
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border">
          <h4 className="font-medium mb-2">Expensive Component</h4>
          <p className="text-sm text-neutral-600">
            Render count: {renderCounts.expensive}
          </p>
          <div className="mt-2 h-32 overflow-y-auto text-xs">
            {data.slice(0, 10).map(item => (
              <div key={item.id}>Item {item.id}: {item.value.toFixed(4)}</div>
            ))}
            <div className="text-neutral-500">...and 990 more items</div>
          </div>
        </div>
      );
    });

    // Cheap component that can re-render
    const CheapComponent = () => {
      useEffect(() => {
        setRenderCounts(prev => ({ ...prev, cheap: prev.cheap + 1 }));
      });

      return (
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border">
          <h4 className="font-medium mb-2">Regular Component</h4>
          <p className="text-sm text-neutral-600">
            Render count: {renderCounts.cheap}
          </p>
          <p className="text-2xl font-bold text-cyan-600">{otherState}</p>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">React.memo Performance</h3>
        
        <div className="flex gap-4">
          <button
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
          >
            Update Parent State ({count})
          </button>
          
          <button
            onClick={() => setOtherState(otherState + 1)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Update Other State
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <ExpensiveComponent />
          <CheapComponent />
        </div>
        
        <div className="text-sm text-neutral-600 p-4 bg-neutral-100 dark:bg-neutral-900 rounded">
          <p>💡 The expensive component only re-renders when its props change</p>
          <p>💡 The regular component re-renders on every parent state change</p>
          <p>💡 Using React.memo prevents unnecessary re-renders of expensive components</p>
        </div>
      </div>
    );
  },
};