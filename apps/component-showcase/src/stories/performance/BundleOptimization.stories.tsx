import type { Meta, StoryObj } from '@storybook/react';
import { useState, lazy, Suspense } from 'react';
import { Button, LoadingSpinner } from '@ganger/ui-catalyst';

const meta: Meta = {
  title: 'Performance/Bundle Optimization',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Demonstrations of code splitting, lazy loading, and bundle size optimization techniques.',
      },
    },
  },
};

export default meta;

// Simulate heavy components
const HeavyChart = lazy(() => 
  new Promise(resolve => {
    setTimeout(() => {
      resolve({
        default: () => (
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border">
            <h4 className="font-medium mb-4">Analytics Chart</h4>
            <div className="h-64 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded flex items-center justify-center">
              <p className="text-neutral-600 dark:text-neutral-400">
                Heavy chart component loaded (simulated 100KB)
              </p>
            </div>
          </div>
        ),
      });
    }, 1500);
  })
);

const HeavyTable = lazy(() => 
  new Promise(resolve => {
    setTimeout(() => {
      resolve({
        default: () => (
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border">
            <h4 className="font-medium mb-4">Data Table</h4>
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded">
                  Row {i + 1} - Heavy table component loaded
                </div>
              ))}
            </div>
          </div>
        ),
      });
    }, 1000);
  })
);

export const CodeSplitting: StoryObj = {
  render: () => {
    const [showChart, setShowChart] = useState(false);
    const [showTable, setShowTable] = useState(false);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Code Splitting Demo</h3>
          <p className="text-sm text-neutral-600">
            Components are loaded only when needed, reducing initial bundle size
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button 
            onClick={() => setShowChart(!showChart)}
            color={showChart ? 'red' : 'blue'}
          >
            {showChart ? 'Hide' : 'Load'} Chart Component
          </Button>
          
          <Button 
            onClick={() => setShowTable(!showTable)}
            color={showTable ? 'red' : 'green'}
          >
            {showTable ? 'Hide' : 'Load'} Table Component
          </Button>
        </div>
        
        <div className="space-y-4">
          {showChart && (
            <Suspense fallback={
              <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border">
                <div className="flex items-center gap-3">
                  <LoadingSpinner size="sm" />
                  <span>Loading chart component...</span>
                </div>
              </div>
            }>
              <HeavyChart />
            </Suspense>
          )}
          
          {showTable && (
            <Suspense fallback={
              <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border">
                <div className="flex items-center gap-3">
                  <LoadingSpinner size="sm" />
                  <span>Loading table component...</span>
                </div>
              </div>
            }>
              <HeavyTable />
            </Suspense>
          )}
        </div>
        
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
          <h4 className="font-medium mb-2">Bundle Impact</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Initial bundle:</span>
              <span className="font-mono">245 KB</span>
            </div>
            <div className="flex justify-between">
              <span>Chart chunk:</span>
              <span className="font-mono">{showChart ? '✓ 100 KB loaded' : '○ Not loaded'}</span>
            </div>
            <div className="flex justify-between">
              <span>Table chunk:</span>
              <span className="font-mono">{showTable ? '✓ 85 KB loaded' : '○ Not loaded'}</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span>Total loaded:</span>
              <span className="font-mono font-medium">
                {245 + (showChart ? 100 : 0) + (showTable ? 85 : 0)} KB
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const DynamicImports: StoryObj = {
  render: () => {
    const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState<string | null>(null);

    const loadModule = async (moduleName: string) => {
      setLoading(moduleName);
      
      // Simulate dynamic import
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setLoadedModules(prev => new Set(prev).add(moduleName));
      setLoading(null);
    };

    const modules = [
      { name: 'charts', size: '125 KB', description: 'Data visualization library' },
      { name: 'pdf', size: '200 KB', description: 'PDF generation library' },
      { name: 'excel', size: '150 KB', description: 'Excel export library' },
      { name: 'maps', size: '300 KB', description: 'Mapping library' },
      { name: 'editor', size: '180 KB', description: 'Rich text editor' },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Dynamic Import Strategy</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {modules.map(module => (
            <div key={module.name} className="p-4 bg-white dark:bg-neutral-800 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium capitalize">{module.name}</h4>
                  <p className="text-sm text-neutral-600">{module.description}</p>
                  <p className="text-xs text-neutral-500 mt-1">Size: {module.size}</p>
                </div>
                {loadedModules.has(module.name) && (
                  <span className="text-green-600">✓</span>
                )}
              </div>
              
              <Button
                size="sm"
                onClick={() => loadModule(module.name)}
                disabled={loadedModules.has(module.name) || loading === module.name}
                color={loadedModules.has(module.name) ? 'gray' : 'blue'}
              >
                {loading === module.name ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Loading...
                  </div>
                ) : loadedModules.has(module.name) ? (
                  'Loaded'
                ) : (
                  'Load Module'
                )}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
          <h4 className="font-medium mb-2">Performance Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-600">Initial Load Time</p>
              <p className="text-2xl font-bold">1.2s</p>
              <p className="text-xs text-green-600">-65% faster</p>
            </div>
            <div>
              <p className="text-neutral-600">Modules Loaded</p>
              <p className="text-2xl font-bold">{loadedModules.size} / {modules.length}</p>
              <p className="text-xs text-neutral-500">
                {modules
                  .filter(m => loadedModules.has(m.name))
                  .reduce((sum, m) => sum + parseInt(m.size), 0)} KB
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const ResourceHints: StoryObj = {
  render: () => {
    const [connections, setConnections] = useState<Array<{
      type: string;
      url: string;
      status: 'idle' | 'connecting' | 'connected';
    }>>([
      { type: 'dns-prefetch', url: 'api.gangerdermatology.com', status: 'idle' },
      { type: 'preconnect', url: 'cdn.gangerdermatology.com', status: 'idle' },
      { type: 'prefetch', url: '/api/patient-data', status: 'idle' },
      { type: 'preload', url: '/fonts/inter.woff2', status: 'idle' },
    ]);

    const simulateConnection = (index: number) => {
      setConnections(prev => {
        const updated = [...prev];
        updated[index].status = 'connecting';
        return updated;
      });

      setTimeout(() => {
        setConnections(prev => {
          const updated = [...prev];
          updated[index].status = 'connected';
          return updated;
        });
      }, Math.random() * 1000 + 500);
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Resource Hints & Preloading</h3>
        
        <div className="space-y-3">
          {connections.map((conn, index) => (
            <div key={index} className="p-4 bg-white dark:bg-neutral-800 rounded-lg border">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-mono text-sm font-medium">{conn.type}</div>
                  <div className="text-sm text-neutral-600">{conn.url}</div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    conn.status === 'connected' ? 'bg-green-500' :
                    conn.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    'bg-neutral-300'
                  }`} />
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateConnection(index)}
                    disabled={conn.status !== 'idle'}
                  >
                    {conn.status === 'connected' ? 'Connected' :
                     conn.status === 'connecting' ? 'Connecting...' :
                     'Connect'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
              With Resource Hints
            </h4>
            <div className="space-y-1 text-sm">
              <p>DNS Lookup: <strong>0ms</strong> (cached)</p>
              <p>TCP Connect: <strong>0ms</strong> (reused)</p>
              <p>First Byte: <strong>45ms</strong></p>
              <p>Total: <strong>95ms</strong></p>
            </div>
          </div>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
              Without Resource Hints
            </h4>
            <div className="space-y-1 text-sm">
              <p>DNS Lookup: <strong>28ms</strong></p>
              <p>TCP Connect: <strong>67ms</strong></p>
              <p>First Byte: <strong>45ms</strong></p>
              <p>Total: <strong>190ms</strong></p>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const ImageOptimization: StoryObj = {
  render: () => {
    const [selectedFormat, setSelectedFormat] = useState<'original' | 'webp' | 'avif'>('original');
    
    const formats = {
      original: { size: '245 KB', quality: '100%', format: 'JPEG' },
      webp: { size: '87 KB', quality: '95%', format: 'WebP' },
      avif: { size: '52 KB', quality: '93%', format: 'AVIF' },
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Next.js Image Optimization</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(formats) as Array<keyof typeof formats>).map(format => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedFormat === format
                  ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <h4 className="font-medium capitalize">{format}</h4>
              <p className="text-sm text-neutral-600">
                {formats[format].format} • {formats[format].size}
              </p>
              <p className="text-xs text-neutral-500">
                Quality: {formats[format].quality}
              </p>
            </button>
          ))}
        </div>
        
        <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border">
          <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded mb-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                {formats[selectedFormat].format}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                {formats[selectedFormat].size}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>File Size Reduction:</span>
              <span className="font-medium text-green-600">
                {selectedFormat === 'original' ? '—' :
                 selectedFormat === 'webp' ? '-64%' : '-79%'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Loading Time:</span>
              <span className="font-medium">
                {selectedFormat === 'original' ? '820ms' :
                 selectedFormat === 'webp' ? '295ms' : '174ms'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Browser Support:</span>
              <span className="font-medium">
                {selectedFormat === 'original' ? '100%' :
                 selectedFormat === 'webp' ? '95%' : '72%'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Optimization Features</h4>
          <ul className="space-y-1">
            <li>✅ Automatic format selection based on browser support</li>
            <li>✅ Responsive image sizing with srcset</li>
            <li>✅ Lazy loading with blur placeholder</li>
            <li>✅ Automatic WebP/AVIF generation</li>
            <li>✅ CDN optimization and caching</li>
          </ul>
        </div>
      </div>
    );
  },
};