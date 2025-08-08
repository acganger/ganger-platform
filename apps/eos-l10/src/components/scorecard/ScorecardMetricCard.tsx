import { useState } from 'react';
import { ScorecardMetric, ScorecardEntry } from '@/types/eos';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  User,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ScorecardMetricCardProps {
  metric: ScorecardMetric;
  entries: ScorecardEntry[];
  selectedWeek: string;
}

export default function ScorecardMetricCard({ 
  metric, 
  entries, 
  selectedWeek 
}: ScorecardMetricCardProps) {
  const [showChart, setShowChart] = useState(false);

  // Get current week entry
  const currentEntry = entries.find(entry => entry.week_ending === selectedWeek);
  
  // Get last 13 weeks for trend
  const trendEntries = entries
    .sort((a, b) => new Date(a.week_ending).getTime() - new Date(b.week_ending).getTime())
    .slice(-13);

  const formatValue = (value: number) => {
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

  const getStatusColor = (status?: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return 'text-green-600 bg-green-100';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100';
      case 'red':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status?: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-4 w-4" />;
      case 'yellow':
        return <AlertCircle className="h-4 w-4" />;
      case 'red':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const calculateTrend = () => {
    if (trendEntries.length < 2) return 'neutral';
    
    const recent = trendEntries.slice(-3);
    const older = trendEntries.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'neutral';
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.value, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (Math.abs(change) < 5) return 'neutral';
    return change > 0 ? 'up' : 'down';
  };

  const getTrendIcon = () => {
    const trend = calculateTrend();
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChartData = () => {
    const labels = trendEntries.map(entry => {
      const date = new Date(entry.week_ending);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = trendEntries.map(entry => entry.value);
    
    return {
      labels,
      datasets: [
        {
          label: metric.name,
          data,
          borderColor: currentEntry?.status === 'green' ? '#10b981' :
                      currentEntry?.status === 'yellow' ? '#f59e0b' :
                      currentEntry?.status === 'red' ? '#ef4444' : '#6b7280',
          backgroundColor: (currentEntry?.status === 'green' ? '#10b981' :
                          currentEntry?.status === 'yellow' ? '#f59e0b' :
                          currentEntry?.status === 'red' ? '#ef4444' : '#6b7280') + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Goal',
          data: new Array(labels.length).fill(metric.goal),
          borderColor: '#374151',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = formatValue(context.parsed.y);
            return `${context.dataset.label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          }
        }
      },
      y: {
        display: true,
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          callback: (value: any) => formatValue(value),
          font: {
            size: 11,
          }
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: '#ffffff',
        hoverBorderWidth: 2,
      }
    }
  };

  return (
    <div className="card group hover:shadow-lg transition-all duration-200">
      <div className="card-header">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="card-title text-sm truncate" title={metric.name}>
              {metric.name}
            </h3>
            {metric.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {metric.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {getTrendIcon()}
            <button
              onClick={() => setShowChart(!showChart)}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="card-content space-y-4">
        {/* Current Value */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {currentEntry ? formatValue(currentEntry.value) : '-'}
            </div>
            <div className="text-sm text-gray-500">
              Goal: {formatValue(metric.goal)}
            </div>
          </div>
          
          {currentEntry && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
              getStatusColor(currentEntry.status)
            }`}>
              {getStatusIcon(currentEntry.status)}
              <span className="capitalize">{currentEntry.status}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {currentEntry && metric.goal > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>
                {Math.round((currentEntry.value / metric.goal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentEntry.status === 'green' ? 'bg-green-500' :
                  currentEntry.status === 'yellow' ? 'bg-yellow-500' :
                  currentEntry.status === 'red' ? 'bg-red-500' : 'bg-gray-500'
                }`}
                style={{ 
                  width: `${Math.min((currentEntry.value / metric.goal) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Chart */}
        {showChart && trendEntries.length > 1 && (
          <div className="h-32">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate">
              {metric.owner?.full_name || 'Unassigned'}
            </span>
          </div>
          
          <div className="flex items-center">
            <Target className="h-3 w-3 mr-1" />
            <span className="capitalize">{metric.frequency}</span>
          </div>
        </div>

        {/* Missing Data Alert */}
        {!currentEntry && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                No data for this week
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        {currentEntry?.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-800">
              <strong>Notes:</strong> {currentEntry.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}