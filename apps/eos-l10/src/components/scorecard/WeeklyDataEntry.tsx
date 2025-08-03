import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-eos';
import { Scorecard, ScorecardMetric, ScorecardEntry } from '@/types/eos';
import { 
  Save, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calculator,
  StickyNote
} from 'lucide-react';

interface WeeklyDataEntryProps {
  scorecard: Scorecard;
  metrics: ScorecardMetric[];
  selectedWeek: string;
  existingEntries: ScorecardEntry[];
  onDataSaved: () => void;
}

interface MetricEntryData {
  metric_id: string;
  value: string;
  notes: string;
  status: 'green' | 'yellow' | 'red';
}

export default function WeeklyDataEntry({
  scorecard,
  metrics,
  selectedWeek,
  existingEntries,
  onDataSaved
}: WeeklyDataEntryProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Record<string, MetricEntryData>>({});
  const [saving, setSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize entries with existing data
    const initialEntries: Record<string, MetricEntryData> = {};
    
    metrics.forEach(metric => {
      const existingEntry = existingEntries.find(e => e.metric_id === metric.id);
      initialEntries[metric.id] = {
        metric_id: metric.id,
        value: existingEntry?.value?.toString() || '',
        notes: existingEntry?.notes || '',
        status: existingEntry?.status || calculateStatus(metric, existingEntry?.value || 0)
      };
    });
    
    setEntries(initialEntries);
  }, [metrics, existingEntries]);

  const calculateStatus = (metric: ScorecardMetric, value: number): 'green' | 'yellow' | 'red' => {
    if (value === 0) return 'red';
    
    const percentage = (value / metric.goal) * 100;
    
    if (percentage >= 100) return 'green';
    if (percentage >= 80) return 'yellow';
    return 'red';
  };

  const updateEntry = (metricId: string, field: keyof MetricEntryData, value: string) => {
    setEntries(prev => {
      const updated = { ...prev };
      updated[metricId] = { ...updated[metricId], [field]: value };
      
      // Auto-calculate status when value changes
      if (field === 'value') {
        const metric = metrics.find(m => m.id === metricId);
        if (metric) {
          const numValue = parseFloat(value) || 0;
          updated[metricId].status = calculateStatus(metric, numValue);
        }
      }
      
      return updated;
    });
  };

  const formatValue = (metric: ScorecardMetric, value: number) => {
    switch (metric.measurement_type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return value.toLocaleString();
    }
  };

  const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return 'bg-green-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-white';
      case 'red':
        return 'bg-red-500 text-white';
    }
  };

  const getStatusIcon = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-5 w-5" />;
      case 'yellow':
        return <AlertCircle className="h-5 w-5" />;
      case 'red':
        return <XCircle className="h-5 w-5" />;
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updates = [];
      const inserts = [];

      for (const [metricId, entryData] of Object.entries(entries)) {
        if (!entryData.value.trim()) continue;

        const value = parseFloat(entryData.value) || 0;
        const existingEntry = existingEntries.find(e => e.metric_id === metricId);

        const entryPayload = {
          scorecard_id: scorecard.id,
          metric_id: metricId,
          value,
          week_ending: selectedWeek,
          notes: entryData.notes || null,
          status: entryData.status
        };

        if (existingEntry) {
          updates.push({ ...entryPayload, id: existingEntry.id });
        } else {
          inserts.push(entryPayload);
        }
      }

      // Save via API
      const response = await fetch('/api/scorecard/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates, inserts })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to save entries');
      }

      onDataSaved();
      
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save entries. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotes = (metricId: string) => {
    setExpandedNotes(prev => {
      const updated = new Set(prev);
      if (updated.has(metricId)) {
        updated.delete(metricId);
      } else {
        updated.add(metricId);
      }
      return updated;
    });
  };

  const getCompletionCount = () => {
    return Object.values(entries).filter(entry => entry.value.trim()).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">
              Data Entry - Week Ending {new Date(selectedWeek + 'T00:00:00').toLocaleDateString()}
            </h3>
            <div className="text-sm text-gray-600">
              {getCompletionCount()} of {metrics.length} completed
            </div>
          </div>
        </div>
        
        <div className="card-content">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Enter your weekly metrics below. Tap the status buttons to override automatic calculations.
            </p>
            
            <button
              onClick={handleSave}
              disabled={saving || getCompletionCount() === 0}
              className="btn-primary flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Entries
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Entry */}
      <div className="space-y-4">
        {metrics.map((metric) => {
          const entry = entries[metric.id] || { metric_id: metric.id, value: '', notes: '', status: 'red' };
          const isNotesExpanded = expandedNotes.has(metric.id);
          
          return (
            <div key={metric.id} className="card">
              <div className="card-content space-y-4">
                {/* Metric Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{metric.name}</h4>
                    {metric.description && (
                      <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Target className="h-4 w-4 mr-1" />
                      Goal: {formatValue(metric, metric.goal)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      {metric.frequency}
                    </div>
                    <div className="text-xs text-gray-500">
                      {metric.measurement_type}
                    </div>
                  </div>
                </div>

                {/* Value Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={entry.value}
                      onChange={(e) => updateEntry(metric.id, 'value', e.target.value)}
                      placeholder={`Enter ${metric.measurement_type} value...`}
                      className="input text-3xl text-center py-4 pr-16"
                      style={{ minHeight: '60px' }}
                    />
                    {metric.measurement_type === 'currency' && (
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">
                        $
                      </div>
                    )}
                    {metric.measurement_type === 'percentage' && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">
                        %
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['green', 'yellow', 'red'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateEntry(metric.id, 'status', status)}
                        className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center space-x-2 transition-all ${
                          entry.status === status
                            ? `${getStatusColor(status)} border-transparent`
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Indicator */}
                {entry.value && metric.goal > 0 && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress to Goal</span>
                      <span>
                        {Math.round((parseFloat(entry.value) / metric.goal) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          entry.status === 'green' ? 'bg-green-500' :
                          entry.status === 'yellow' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min((parseFloat(entry.value) / metric.goal) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div>
                  <button
                    onClick={() => toggleNotes(metric.id)}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <StickyNote className="h-4 w-4 mr-1" />
                    Add Notes {entry.notes && '(has notes)'}
                  </button>
                  
                  {isNotesExpanded && (
                    <div className="mt-2">
                      <textarea
                        value={entry.notes}
                        onChange={(e) => updateEntry(metric.id, 'notes', e.target.value)}
                        placeholder="Add context, explanations, or action items..."
                        rows={3}
                        className="input text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Weekly Summary</h4>
              <p className="text-sm text-blue-700">
                {getCompletionCount()} of {metrics.length} metrics entered
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {Object.values(entries).reduce((acc, entry) => {
                if (entry.value.trim()) {
                  acc[entry.status] = (acc[entry.status] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>) && 
                Object.entries(Object.values(entries).reduce((acc, entry) => {
                  if (entry.value.trim()) {
                    acc[entry.status] = (acc[entry.status] || 0) + 1;
                  }
                  return acc;
                }, {} as Record<string, number>)).map(([status, count]) => (
                  <div key={status} className="flex items-center space-x-1">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'green' ? 'bg-green-500' :
                      status === 'yellow' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-blue-700">{count}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}