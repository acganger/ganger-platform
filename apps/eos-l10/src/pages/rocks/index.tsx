import { useState, useEffect } from 'react';
import Head from 'next/head';
import SafeLink from '@/components/ui/SafeLink';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { usePresence } from '@/hooks/usePresence';
import Layout from '@/components/Layout';
import PresenceIndicator from '@/components/PresenceIndicator';
import { Rock } from '@/types/eos';
import { supabase } from '@/lib/supabase';
import { useAuth, AuthGuard, TeamGuard } from '@/lib/auth-eos';
import { 
  Target, 
  Plus, 
  Calendar, 
  User, 
  Search,
  Edit3,
  Trash2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function RocksPage() {
  const { userRole } = useAuth();
  const { rocks, loading, error } = useRealtimeData();
  usePresence('rocks');
  
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [draggedRocks, setDraggedRocks] = useState<Rock[]>([]);

  // Initialize dragged rocks when real data loads
  useEffect(() => {
    if (rocks.length > 0) {
      setDraggedRocks([...rocks]);
    }
  }, [rocks]);

  // Get current quarter if none selected
  useEffect(() => {
    if (!selectedQuarter) {
      const now = new Date();
      const year = now.getFullYear();
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      setSelectedQuarter(`Q${quarter} ${year}`);
    }
  }, [selectedQuarter]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    const newRocks = Array.from(draggedRocks);
    const [movedRock] = newRocks.splice(source.index, 1);
    if (!movedRock) return;
    newRocks.splice(destination.index, 0, movedRock);

    // Update priorities based on new order
    const updatedRocks = newRocks.map((rock, index) => ({
      ...rock,
      priority: index + 1
    }));

    setDraggedRocks(updatedRocks);

    // Update priorities in database
    try {
      for (const rock of updatedRocks) {
        await supabase
          .from('rocks')
          .update({ priority: rock.priority })
          .eq('id', rock.id);
      }
    } catch (error) {
      // Revert on error
      setDraggedRocks([...rocks]);
    }
  };

  const getStatusColor = (status: Rock['status']) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'off_track':
        return 'bg-red-100 text-red-800';
      case 'complete':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percentage: number, status: Rock['status']) => {
    if (status === 'complete') return 'bg-blue-500';
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredRocks = draggedRocks.filter(rock => {
    const matchesQuarter = !selectedQuarter || rock.quarter === selectedQuarter;
    const matchesSearch = !searchTerm || 
      rock.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rock.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rock.status === statusFilter;
    
    return matchesQuarter && matchesSearch && matchesStatus;
  });

  const quarterOptions = Array.from(new Set(rocks.map(rock => rock.quarter))).sort();

  return (
    <AuthGuard>
      <TeamGuard>
        <div>
          <Head>
            <title>Rocks - EOS L10 Platform</title>
            <meta name="description" content="Quarterly rocks tracking and management" />
          </Head>

          <Layout>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Target className="h-6 w-6 mr-2 text-eos-600" />
                    Rocks
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Track and prioritize quarterly goals
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                  <PresenceIndicator page="rocks" />
                  {(userRole === 'leader' || userRole === 'member') && (
                    <SafeLink
                      href="/rocks/new"
                      className="btn-primary flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Rock
                    </SafeLink>
                  )}
                </div>
              </div>

              {/* Error handling */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">Error loading rocks: {error}</p>
                </div>
              )}

              {/* Filters */}
              <div className="card">
                <div className="card-content">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Quarter Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quarter
                      </label>
                      <select
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(e.target.value)}
                        className="input"
                      >
                        <option value="">All Quarters</option>
                        {quarterOptions.map(quarter => (
                          <option key={quarter} value={quarter}>{quarter}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input"
                      >
                        <option value="all">All Status</option>
                        <option value="not_started">Not Started</option>
                        <option value="on_track">On Track</option>
                        <option value="off_track">Off Track</option>
                        <option value="complete">Complete</option>
                      </select>
                    </div>

                    {/* Search */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search rocks..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="input pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rocks List */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="card-title">
                      {selectedQuarter || 'All Quarters'} ({filteredRocks.length} rocks)
                    </h3>
                    <div className="text-sm text-gray-500">
                      Drag to reorder priority
                    </div>
                  </div>
                </div>

                <div className="card-content">
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="flex items-start space-x-4">
                            <div className="skeleton w-8 h-8 rounded"></div>
                            <div className="flex-1">
                              <div className="skeleton h-5 w-2/3 mb-2"></div>
                              <div className="skeleton h-4 w-full mb-3"></div>
                              <div className="flex space-x-4">
                                <div className="skeleton h-4 w-24"></div>
                                <div className="skeleton h-4 w-32"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredRocks.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No rocks found</h3>
                      <p className="text-gray-500 mb-4">
                        {rocks.length === 0 
                          ? "Create your first quarterly rock to get started"
                          : "Try adjusting your filters"
                        }
                      </p>
                      {(userRole === 'leader' || userRole === 'member') && rocks.length === 0 && (
                        <SafeLink href="/rocks/new" className="btn-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Rock
                        </SafeLink>
                      )}
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="rocks-list">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-3 ${
                              snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                            }`}
                          >
                            {filteredRocks.map((rock, index) => (
                              <Draggable
                                key={rock.id}
                                draggableId={rock.id}
                                index={index}
                                isDragDisabled={userRole === 'viewer'}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg' : ''
                                    }`}
                                  >
                                    <div className="flex items-start space-x-4">
                                      {/* Drag Handle */}
                                      <div
                                        {...provided.dragHandleProps}
                                        className="flex-shrink-0 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing"
                                      >
                                        <div className="w-6 h-6 flex items-center justify-center">
                                          <div className="grid grid-cols-2 gap-0.5">
                                            {[...Array(6)].map((_, i) => (
                                              <div key={i} className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Priority Badge */}
                                      <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-eos-100 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-bold text-eos-700">
                                            {rock.priority}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Rock Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <SafeLink 
                                              href={`/rocks/${rock.id}`}
                                              className="text-lg font-semibold text-gray-900 hover:text-eos-600"
                                            >
                                              {rock.title}
                                            </SafeLink>
                                            {rock.description && (
                                              <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                                                {rock.description}
                                              </p>
                                            )}
                                          </div>

                                          {/* Actions */}
                                          {(userRole === 'leader' || userRole === 'member') && (
                                            <div className="flex items-center space-x-2 ml-4">
                                              <SafeLink
                                                href={`/rocks/${rock.id}/edit`}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                              >
                                                <Edit3 className="h-4 w-4" />
                                              </SafeLink>
                                              <button className="p-1 text-gray-400 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-3">
                                          <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-gray-600">Progress</span>
                                            <span className="font-medium">{rock.completion_percentage}%</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                              className={`h-2 rounded-full transition-all duration-300 ${
                                                getProgressColor(rock.completion_percentage, rock.status)
                                              }`}
                                              style={{ width: `${rock.completion_percentage}%` }}
                                            ></div>
                                          </div>
                                        </div>

                                        {/* Meta Information */}
                                        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                                          <div className="flex items-center space-x-4">
                                            <div className="flex items-center">
                                              <User className="h-4 w-4 mr-1" />
                                              Owner: {rock.owner_id}
                                            </div>
                                            <div className="flex items-center">
                                              <Calendar className="h-4 w-4 mr-1" />
                                              Due: {new Date(rock.due_date).toLocaleDateString()}
                                            </div>
                                          </div>
                                          
                                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            getStatusColor(rock.status)
                                          }`}>
                                            {rock.status.replace('_', ' ').toUpperCase()}
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
