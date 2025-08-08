import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import SafeLink from '@/components/ui/SafeLink';
import { usePresence } from '@/hooks/usePresence';
import Layout from '@/components/Layout';
import PresenceIndicator from '@/components/PresenceIndicator';
import { Scorecard, ScorecardMetric } from '@/types/eos';
import { supabase } from '@/lib/supabase';
import { 
  Target, 
  Plus, 
  ArrowLeft,
  Edit3,
  Trash2,
  GripVertical,
  Settings,
  User,
  BarChart3,
  Save,
  X
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface MetricFormData {
  name: string;
  description: string;
  goal: string;
  measurement_type: 'number' | 'percentage' | 'currency' | 'boolean';
  frequency: 'daily' | 'weekly' | 'monthly';
  owner_id: string;
}

export default function ScorecardMetricsPage() {
  const { activeTeam, user, userRole } = useAuth();
  const { onlineUsers } = usePresence('scorecard-metrics');
  
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [metrics, setMetrics] = useState<ScorecardMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ScorecardMetric | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<MetricFormData>({
    name: '',
    description: '',
    goal: '',
    measurement_type: 'number',
    frequency: 'weekly',
    owner_id: (user as any)?.id || ''
  });

  useEffect(() => {
    if (activeTeam) {
      loadMetrics();
    }
  }, [activeTeam]);

  useEffect(() => {
    if (user && !formData.owner_id) {
      setFormData(prev => ({ ...prev, owner_id: (user as any).id }));
    }
  }, [user]);

  const loadMetrics = async () => {
    if (!activeTeam) return;

    try {
      setLoading(true);
      setError(null);

      // Load or create scorecard
      let { data: scorecardData, error: scorecardError } = await supabase
        .from('scorecards')
        .select('*')
        .eq('team_id', activeTeam.id as any)
        .eq('active', true as any)
        .single();

      if (scorecardError && scorecardError.code === 'PGRST116') {
        const { data: newScorecard, error: createError } = await supabase
          .from('scorecards')
          .insert({
            team_id: activeTeam.id,
            name: `${activeTeam.name} Scorecard`,
            description: 'Team performance metrics',
            active: true
          } as any)
          .select()
          .single();

        if (createError) throw createError;
        scorecardData = newScorecard;
      } else if (scorecardError) {
        throw scorecardError;
      }

      setScorecard((scorecardData as any));

      // Load metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('scorecard_metrics')
        .select(`
          *,
          owner:users(full_name, email, avatar_url)
        `)
        .eq('scorecard_id', (scorecardData as any).id as any)
        .order('sort_order');

      if (metricsError) throw metricsError;
      setMetrics((metricsData as any) || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    const newMetrics = Array.from(metrics);
    const [movedMetric] = newMetrics.splice(source.index, 1);
    newMetrics.splice(destination.index, 0, movedMetric);

    // Update sort_order based on new positions
    const updatedMetrics = newMetrics.map((metric, index) => ({
      ...metric,
      sort_order: index + 1
    }));

    setMetrics(updatedMetrics);

    // Update in database
    try {
      for (const metric of updatedMetrics) {
        await supabase
          .from('scorecard_metrics')
          .update({ sort_order: metric.sort_order } as any)
          .eq('id', (metric as any).id);
      }
    } catch (error) {
      // Revert on error
      loadMetrics();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      goal: '',
      measurement_type: 'number',
      frequency: 'weekly',
      owner_id: (user as any)?.id || ''
    });
    setEditingMetric(null);
  };

  const handleEdit = (metric: ScorecardMetric) => {
    setFormData({
      name: metric.name,
      description: metric.description || '',
      goal: metric.goal.toString(),
      measurement_type: metric.measurement_type,
      frequency: metric.frequency,
      owner_id: metric.owner_id
    });
    setEditingMetric(metric);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scorecard || !user) return;

    setSaving(true);
    try {
      const goal = parseFloat(formData.goal) || 0;
      
      if (editingMetric) {
        // Update existing metric
        const { error } = await supabase
          .from('scorecard_metrics')
          .update({
            name: formData.name,
            description: formData.description || null,
            goal,
            measurement_type: formData.measurement_type,
            frequency: formData.frequency,
            owner_id: formData.owner_id
          } as any)
          .eq('id', (editingMetric as any).id as any);

        if (error) throw error;
      } else {
        // Create new metric
        const nextSortOrder = Math.max(...metrics.map(m => m.sort_order), 0) + 1;
        
        const { error } = await supabase
          .from('scorecard_metrics')
          .insert({
            scorecard_id: scorecard.id,
            name: formData.name,
            description: formData.description || null,
            goal,
            measurement_type: formData.measurement_type,
            frequency: formData.frequency,
            owner_id: formData.owner_id,
            sort_order: nextSortOrder,
            active: true
          } as any);

        if (error) throw error;
      }

      setShowForm(false);
      resetForm();
      loadMetrics();
      
    } catch (error) {
      alert('Failed to save metric. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (metric: ScorecardMetric) => {
    if (!confirm(`Are you sure you want to delete "${metric.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scorecard_metrics')
        .update({ active: false } as any)
        .eq('id', (metric as any).id);

      if (error) throw error;
      loadMetrics();
      
    } catch (error) {
      alert('Failed to delete metric. Please try again.');
    }
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

  if (userRole === 'viewer') {
    return (
      <AuthGuard>
        <TeamGuard>
          <Layout>
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-500">
                You don't have permission to manage scorecard metrics.
              </p>
              <SafeLink href="/scorecard" className="btn-primary mt-4">
                Back to Scorecard
              </SafeLink>
            </div>
          </Layout>
        </TeamGuard>
      </AuthGuard>
    );
  }

  if (loading) {
    return (
      <AuthGuard>
        <TeamGuard>
          <Layout>
            <div className="space-y-6">
              <div className="skeleton h-8 w-64"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card">
                    <div className="card-content">
                      <div className="skeleton h-6 w-full mb-2"></div>
                      <div className="skeleton h-4 w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Layout>
        </TeamGuard>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <TeamGuard>
        <div>
          <Head>
            <title>Scorecard Metrics - EOS L10 Platform</title>
            <meta name="description" content="Manage your team scorecard metrics and configuration" />
          </Head>

          <Layout>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <SafeLink
                    href="/scorecard"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </SafeLink>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      <Settings className="h-6 w-6 mr-2 text-eos-600" />
                      Scorecard Metrics
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Configure and manage your team's performance metrics
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <PresenceIndicator page="scorecard-metrics" />
                  
                  <button
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                    className="btn-primary flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Metric
                  </button>
                </div>
              </div>

              {/* Error handling */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">Error: {error}</p>
                </div>
              )}

              {/* Metric Form */}
              {showForm && (
                <div className="card">
                  <form onSubmit={handleSubmit}>
                    <div className="card-header">
                      <div className="flex items-center justify-between">
                        <h3 className="card-title">
                          {editingMetric ? 'Edit Metric' : 'Add New Metric'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            resetForm();
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="card-content space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Metric Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Weekly Revenue"
                            className="input"
                            maxLength={100}
                          />
                        </div>

                        {/* Goal */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Goal/Target *
                          </label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            value={formData.goal}
                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                            placeholder="100"
                            className="input"
                          />
                        </div>

                        {/* Measurement Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Measurement Type *
                          </label>
                          <select
                            required
                            value={formData.measurement_type}
                            onChange={(e) => setFormData({ ...formData, measurement_type: e.target.value as any })}
                            className="input"
                          >
                            <option value="number">Number</option>
                            <option value="percentage">Percentage</option>
                            <option value="currency">Currency</option>
                            <option value="boolean">Yes/No</option>
                          </select>
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frequency *
                          </label>
                          <select
                            required
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                            className="input"
                          >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="daily">Daily</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          placeholder="Optional: Describe what this metric measures..."
                          className="input"
                          maxLength={300}
                        />
                      </div>

                      {/* Owner */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Metric Owner *
                        </label>
                        <select
                          required
                          value={formData.owner_id}
                          onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                          className="input"
                        >
                          <option value={(user as any)?.id || ''}>
                            Me ({(user as any)?.email || ''})
                          </option>
                          {/* TODO: Add team members when available */}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Who is responsible for tracking this metric?
                        </p>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            resetForm();
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        
                        <button
                          type="submit"
                          disabled={saving}
                          className="btn-primary"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {editingMetric ? 'Update' : 'Create'} Metric
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Metrics List */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="card-title">
                      Team Metrics ({metrics.filter(m => m.active).length})
                    </h3>
                    <div className="text-sm text-gray-500">
                      Drag to reorder
                    </div>
                  </div>
                </div>

                <div className="card-content">
                  {metrics.filter(m => m.active).length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No metrics configured</h3>
                      <p className="text-gray-500 mb-4">
                        Add your first scorecard metric to start tracking performance
                      </p>
                      <button
                        onClick={() => {
                          resetForm();
                          setShowForm(true);
                        }}
                        className="btn-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Metric
                      </button>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="metrics-list">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-3 ${
                              snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                            }`}
                          >
                            {metrics.filter(m => m.active).map((metric, index) => (
                              <Draggable
                                key={metric.id}
                                draggableId={metric.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-4">
                                      {/* Drag Handle */}
                                      <div
                                        {...provided.dragHandleProps}
                                        className="flex-shrink-0 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="h-5 w-5 text-gray-400" />
                                      </div>

                                      {/* Metric Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">
                                              {metric.name}
                                            </h4>
                                            {metric.description && (
                                              <p className="text-sm text-gray-600 mt-1">
                                                {metric.description}
                                              </p>
                                            )}
                                          </div>

                                          {/* Actions */}
                                          <div className="flex items-center space-x-2 ml-4">
                                            <button
                                              onClick={() => handleEdit(metric)}
                                              className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                              <Edit3 className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => handleDelete(metric)}
                                              className="p-1 text-gray-400 hover:text-red-600"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Metric Details */}
                                        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                                          <div className="flex items-center space-x-4">
                                            <div className="flex items-center">
                                              <Target className="h-4 w-4 mr-1" />
                                              Goal: {formatValue(metric, metric.goal)}
                                            </div>
                                            <div className="flex items-center">
                                              <BarChart3 className="h-4 w-4 mr-1" />
                                              {metric.measurement_type}
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center space-x-4">
                                            <span className="capitalize">{metric.frequency}</span>
                                            <div className="flex items-center">
                                              <User className="h-4 w-4 mr-1" />
                                              {metric.owner?.full_name || 'Unassigned'}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </div>
              </div>
            </div>
          </Layout>
        </div>
      </TeamGuard>
    </AuthGuard>
  );
}

// Force SSR to prevent auth context issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}
