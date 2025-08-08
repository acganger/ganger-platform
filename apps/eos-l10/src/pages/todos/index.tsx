import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Todo, CreateTodoForm } from '@/types/eos';
import { useAuth } from '@/lib/auth-eos';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  CheckSquare,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import TodoCard from '@/components/todos/TodoCard';
import TodoForm from '@/components/todos/TodoForm';
import TodoFilters from '@/components/todos/TodoFilters';
import TodoKanban from '@/components/todos/TodoKanban';

interface TodoFilters {
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
}

export default function TodosPage() {
  const router = useRouter();
  const { activeTeam, user } = useAuth();
  const teamId = activeTeam?.id;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [filters, setFilters] = useState<TodoFilters>({
    status: 'active', // Show active todos by default
    priority: 'all',
    assignee: 'all',
    dueDate: 'all'
  });

  // Fetch todos
  const fetchTodos = async () => {
    if (!teamId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('team_id', teamId as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos((data as any[]) || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!teamId) return;

    fetchTodos();

    const channel = supabase
      .channel(`todos:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `team_id=eq.${teamId}`
        },
        () => {
          fetchTodos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  // Filter and search todos
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      // Status filter
      if (filters.status === 'active' && todo.status === 'completed') return false;
      if (filters.status === 'completed' && todo.status !== 'completed') return false;
      if (filters.status !== 'all' && filters.status !== 'active' && todo.status !== filters.status) return false;

      // Priority filter
      if (filters.priority !== 'all' && todo.priority !== filters.priority) return false;

      // Assignee filter
      if (filters.assignee === 'me' && todo.assigned_to !== (user as any)?.id) return false;
      if (filters.assignee !== 'all' && filters.assignee !== 'me' && todo.assigned_to !== filters.assignee) return false;

      // Due date filter
      if (filters.dueDate !== 'all') {
        const dueDate = new Date(todo.due_date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        switch (filters.dueDate) {
          case 'overdue':
            if (dueDate >= today) return false;
            break;
          case 'today':
            if (dueDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'tomorrow':
            if (dueDate.toDateString() !== tomorrow.toDateString()) return false;
            break;
          case 'this_week':
            if (dueDate > nextWeek) return false;
            break;
        }
      }

      // Search filter
      if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [todos, filters, searchQuery, (user as any)?.id]);

  // Create todo
  const handleCreateTodo = async (data: CreateTodoForm) => {
    if (!teamId || !user) return;

    try {
      const { error } = await supabase
        .from('todos')
        .insert([
          {
            title: data.title,
            description: data.description,
            assigned_to: data.assigned_to,
            due_date: data.due_date,
            priority: data.priority,
            team_id: teamId as any,
            created_by: (user as any)?.id || 'anonymous',
            status: 'pending'
          } as any
        ]);

      if (error) throw error;
      setShowForm(false);
    } catch (error) {
    }
  };

  // Update todo
  const handleUpdateTodo = async (todoId: string, updates: Partial<Todo>) => {
    try {
      const updateData: any = {};
      
      // Only include defined fields
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      
      // Set completion timestamp if marking as completed
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
      
      // Clear completion timestamp if unmarking as completed
      if (updates.status && updates.status !== 'completed') {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', todoId as any);

      if (error) throw error;
    } catch (error) {
    }
  };

  // Delete todo
  const handleDeleteTodo = async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId as any);

      if (error) throw error;
    } catch (error) {
    }
  };

  // Analytics data
  const analytics = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.status === 'completed').length;
    const pending = todos.filter(t => t.status === 'pending').length;
    const inProgress = todos.filter(t => t.status === 'in_progress').length;
    const overdue = todos.filter(t => {
      return t.status !== 'completed' && new Date(t.due_date) < new Date();
    }).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, inProgress, overdue, completionRate };
  }, [todos]);

  if (!teamId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please select a team</h2>
          <button
            onClick={() => router.push('/')}
            className="bg-eos-600 text-white px-6 py-3 rounded-lg hover:bg-eos-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <CheckSquare className="h-8 w-8 text-eos-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Todos</h1>
                <p className="text-sm text-gray-600">Track action items and assignments</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('board')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'board' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Board
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${
                  showFilters || Object.values(filters).some(f => f !== 'all' && f !== 'active')
                    ? 'bg-eos-50 border-eos-200 text-eos-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowForm(true)}
                className="bg-eos-600 text-white px-4 py-2 rounded-lg hover:bg-eos-700 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:block">Add Todo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{analytics.completed}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.pending}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{analytics.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rate</p>
                <p className="text-2xl font-bold text-eos-600">{analytics.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-eos-400" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eos-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <TodoFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-eos-200 border-t-eos-600 rounded-full animate-spin"></div>
          </div>
        ) : viewMode === 'board' ? (
          <TodoKanban
            todos={filteredTodos}
            onUpdateTodo={handleUpdateTodo}
            onDeleteTodo={handleDeleteTodo}
            onEditTodo={setEditingTodo}
          />
        ) : (
          <div className="space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No todos found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== 'active')
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first todo item'
                  }
                </p>
                {!searchQuery && !Object.values(filters).some(f => f !== 'all' && f !== 'active') && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 bg-eos-600 text-white px-4 py-2 rounded-lg hover:bg-eos-700"
                  >
                    Add Todo
                  </button>
                )}
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onUpdate={handleUpdateTodo}
                  onDelete={handleDeleteTodo}
                  onClick={() => setEditingTodo(todo)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Todo Form Modal */}
      {(showForm || editingTodo) && (
        <TodoForm
          onSubmit={editingTodo ? 
            (data) => handleUpdateTodo(editingTodo.id, data).then(() => setEditingTodo(null)) :
            handleCreateTodo
          }
          onClose={() => {
            setShowForm(false);
            setEditingTodo(null);
          }}
          initialData={editingTodo ? {
            title: editingTodo.title,
            description: editingTodo.description || '',
            assigned_to: editingTodo.assigned_to,
            due_date: editingTodo.due_date,
            priority: editingTodo.priority
          } : undefined}
        />
      )}
    </div>
  );
}
// Force SSR to prevent auth context issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}
