import { useState } from 'react';
import { ScorecardMetric, ScorecardEntry } from '@/types/eos';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  Target,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Minus
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface TrendAnalyzerProps {
  metrics: ScorecardMetric[];
  entries: ScorecardEntry[];
  selectedWeek: string;
}

export default function TrendAnalyzer({ 
  metrics, 
  entries, 
  selectedWeek 
}: TrendAnalyzerProps) {
  const [selectedMetricId, setSelectedMetricId] = useState<string>(metrics[0]?.id || '');
  const [viewType, setViewType] = useState<'line' | 'bar' | 'overview'>('overview');

  // Get last 13 weeks of data
  const getWeeklyData = () => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 12; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (today.getDay() + (i * 7)));
      weeks.push(weekEnd.toISOString().split('T')[0]);
    }
    
    return weeks;
  };

  const weeks = getWeeklyData();
  const selectedMetric = metrics.find(m => m.id === selectedMetricId);

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

  // Individual metric trend chart
  const getMetricTrendData = () => {
    if (!selectedMetric) return null;

    const metricEntries = entries.filter(e => e.metric_id === selectedMetricId);
    const data = weeks.map(week => {
      const entry = metricEntries.find(e => e.week_ending === week);
      return entry ? entry.value : null;
    });

    const labels = weeks.map(week => {
      const date = new Date(week + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      datasets: [
        {
          label: selectedMetric.name,
          data,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f620',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          spanGaps: true,
        },
        {
          label: 'Goal',
          data: new Array(weeks.length).fill(selectedMetric.goal),
          borderColor: '#ef4444',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ]
    };
  };

  // Team performance overview
  const getTeamOverviewData = () => {
    const currentWeekEntries = entries.filter(e => e.week_ending === selectedWeek);
    
    const labels = metrics.map(m => m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name);
    const data = metrics.map(metric => {
      const entry = currentWeekEntries.find(e => e.metric_id === metric.id);
      return entry ? (entry.value / metric.goal) * 100 : 0;
    });

    const backgroundColors = metrics.map(metric => {
      const entry = currentWeekEntries.find(e => e.metric_id === metric.id);
      if (!entry) return '#6b7280';
      
      switch (entry.status) {
        case 'green': return '#10b981';
        case 'yellow': return '#f59e0b';
        case 'red': return '#ef4444';
        default: return '#6b7280';
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Goal Achievement %',
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color + 'dd'),
          borderWidth: 1,
        }
      ]
    };
  };

  // Status distribution pie chart
  const getStatusDistribution = () => {
    const currentWeekEntries = entries.filter(e => e.week_ending === selectedWeek);
    
    const statusCounts = currentWeekEntries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: ['Green', 'Yellow', 'Red'],
      datasets: [
        {
          data: [
            statusCounts.green || 0,
            statusCounts.yellow || 0,
            statusCounts.red || 0
          ],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 2,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (selectedMetric && viewType === 'line') {
              return `${context.dataset.label}: ${formatValue(selectedMetric, context.parsed.y)}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: viewType !== 'overview' ? {} : {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        max: 150,
        ticks: {
          callback: (value: any) => `${value}%`
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false }
    }
  };

  // Calculate trend insights
  const calculateTrendInsights = () => {
    const insights = [];
    const currentWeekEntries = entries.filter(e => e.week_ending === selectedWeek);
    
    // Overall team health
    const statusCounts = currentWeekEntries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEntries = currentWeekEntries.length;
    const greenPercentage = ((statusCounts.green || 0) / totalEntries) * 100;
    
    if (greenPercentage >= 80) {
      insights.push({
        type: 'success',
        title: 'Strong Performance',
        description: `${Math.round(greenPercentage)}% of metrics are hitting targets this week.`
      });
    } else if (greenPercentage >= 60) {
      insights.push({
        type: 'warning',
        title: 'Mixed Performance',
        description: `${Math.round(greenPercentage)}% of metrics on track. Some areas need attention.`
      });
    } else {
      insights.push({
        type: 'danger',
        title: 'Performance Alert',
        description: `Only ${Math.round(greenPercentage)}% of metrics hitting targets. Review needed.`
      });
    }

    // Trending metrics
    metrics.forEach(metric => {
      const metricEntries = entries
        .filter(e => e.metric_id === metric.id)
        .sort((a, b) => new Date(a.week_ending).getTime() - new Date(b.week_ending).getTime())
        .slice(-4); // Last 4 weeks

      if (metricEntries.length >= 3) {
        const recent = metricEntries.slice(-2);
        const older = metricEntries.slice(-4, -2);
        
        const recentAvg = recent.reduce((sum, e) => sum + e.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.value, 0) / older.length;
        
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (Math.abs(change) > 20) {
          insights.push({
            type: change > 0 ? 'success' : 'warning',
            title: `${metric.name} ${change > 0 ? 'Improving' : 'Declining'}`,
            description: `${Math.round(Math.abs(change))}% ${change > 0 ? 'increase' : 'decrease'} in recent weeks.`
          });
        }
      }
    });

    return insights.slice(0, 5); // Limit to 5 insights
  };

  const insights = calculateTrendInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="card-title">Trend Analysis</h3>
            
            <div className="mt-3 sm:mt-0 flex items-center space-x-3">
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value as 'line' | 'bar' | 'overview')}
                className="input text-sm"
              >
                <option value="overview">Team Overview</option>
                <option value="line">Metric Trend</option>
                <option value="bar">Goal Achievement</option>
              </select>
              
              {viewType === 'line' && (
                <select
                  value={selectedMetricId}
                  onChange={(e) => setSelectedMetricId(e.target.value)}
                  className="input text-sm"
                >
                  {metrics.map(metric => (
                    <option key={metric.id} value={metric.id}>
                      {metric.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title text-base">
                {viewType === 'overview' && 'Team Performance Overview'}
                {viewType === 'line' && `${selectedMetric?.name} Trend`}
                {viewType === 'bar' && 'Goal Achievement by Metric'}
              </h4>
            </div>
            <div className="card-content">
              <div className="h-64">
                {viewType === 'overview' && (
                  <Bar data={getTeamOverviewData()} options={barChartOptions} />
                )}
                {viewType === 'line' && selectedMetric && (
                  <Line data={getMetricTrendData()!} options={chartOptions} />
                )}
                {viewType === 'bar' && (
                  <Bar data={getTeamOverviewData()} options={barChartOptions} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title text-base">Status Distribution</h4>
            </div>
            <div className="card-content">
              <div className="h-48">
                <Doughnut 
                  data={getStatusDistribution()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Performance Insights</h4>
        </div>
        <div className="card-content">
          {insights.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Enter more data to generate performance insights.
            </p>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'bg-green-50 border-green-400' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`mr-3 ${
                      insight.type === 'success' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {insight.type === 'success' && <CheckCircle className="h-5 w-5" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                      {insight.type === 'danger' && <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h5 className={`font-medium ${
                        insight.type === 'success' ? 'text-green-800' :
                        insight.type === 'warning' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        {insight.title}
                      </h5>
                      <p className={`text-sm mt-1 ${
                        insight.type === 'success' ? 'text-green-700' :
                        insight.type === 'warning' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-content text-center">
            <div className="text-2xl font-bold text-gray-900">
              {entries.filter(e => e.week_ending === selectedWeek).length}
            </div>
            <div className="text-sm text-gray-600">Entries This Week</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content text-center">
            <div className="text-2xl font-bold text-green-600">
              {entries.filter(e => e.week_ending === selectedWeek && e.status === 'green').length}
            </div>
            <div className="text-sm text-gray-600">On Target</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {entries.filter(e => e.week_ending === selectedWeek && e.status === 'yellow').length}
            </div>
            <div className="text-sm text-gray-600">At Risk</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content text-center">
            <div className="text-2xl font-bold text-red-600">
              {entries.filter(e => e.week_ending === selectedWeek && e.status === 'red').length}
            </div>
            <div className="text-sm text-gray-600">Below Target</div>
          </div>
        </div>
      </div>
    </div>
  );
}