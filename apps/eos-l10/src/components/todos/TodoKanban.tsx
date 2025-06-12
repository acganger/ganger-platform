import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Todo } from '@/types/eos';
import TodoCard from './TodoCard';
import { 
  Square, 
  Play, 
  CheckCircle, 
  Pause,
  Plus
} from 'lucide-react';

interface TodoKanbanProps {
  todos: Todo[];
  onUpdateTodo: (todoId: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (todoId: string) => void;
  onEditTodo: (todo: Todo) => void;
}

const columns = [
  {
    id: 'pending',
    title: 'Pending',
    icon: Square,
    color: 'border-gray-300',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Play,
    color: 'border-blue-300',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'border-green-300',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  {
    id: 'dropped',
    title: 'Dropped',
    icon: Pause,
    color: 'border-gray-300',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500'
  }
];

export default function TodoKanban({ todos, onUpdateTodo, onDeleteTodo, onEditTodo }: TodoKanbanProps) {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Check if dropped outside of droppable area
    if (!destination) {
      return;
    }

    // Check if dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update todo status based on destination column
    const newStatus = destination.droppableId as Todo['status'];
    const updates: Partial<Todo> = { status: newStatus };

    // Set completion timestamp if moving to completed
    if (newStatus === 'completed' && source.droppableId !== 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    // Clear completion timestamp if moving away from completed
    if (newStatus !== 'completed' && source.droppableId === 'completed') {
      updates.completed_at = undefined;
    }

    onUpdateTodo(draggableId, updates);
  };

  const getTodosForColumn = (columnId: string) => {
    return todos.filter(todo => todo.status === columnId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const Icon = column.icon;
          const columnTodos = getTodosForColumn(column.id);

          return (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={`${column.bgColor} ${column.color} border-2 border-dashed rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${column.textColor}`} />
                    <h3 className={`font-medium ${column.textColor}`}>
                      {column.title}
                    </h3>
                  </div>
                  <span className={`text-sm ${column.textColor} bg-white px-2 py-1 rounded-full`}>
                    {columnTodos.length}
                  </span>
                </div>
              </div>

              {/* Droppable Column */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-96 p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver
                        ? `${column.bgColor} border-2 border-dashed ${column.color}`
                        : 'bg-gray-50 border-2 border-dashed border-transparent'
                    }`}
                  >
                    <div className="space-y-3">
                      {columnTodos.map((todo, index) => (
                        <Draggable
                          key={todo.id}
                          draggableId={todo.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TodoCard
                                todo={todo}
                                onUpdate={onUpdateTodo}
                                onDelete={onDeleteTodo}
                                onClick={() => onEditTodo(todo)}
                                compact={true}
                                dragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {/* Empty State */}
                    {columnTodos.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Icon className="h-8 w-8 mb-2" />
                        <p className="text-sm text-center">
                          {column.id === 'pending' && 'No pending todos'}
                          {column.id === 'in_progress' && 'No todos in progress'}
                          {column.id === 'completed' && 'No completed todos'}
                          {column.id === 'dropped' && 'No dropped todos'}
                        </p>
                        {column.id === 'pending' && (
                          <p className="text-xs text-center mt-1">
                            Drag todos here or create new ones
                          </p>
                        )}
                      </div>
                    )}

                    {/* Drop Zone Indicator */}
                    {snapshot.isDraggingOver && columnTodos.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <Icon className="h-8 w-8 mb-2" />
                        <p className="text-sm font-medium">Drop todo here</p>
                        <p className="text-xs">
                          Will be marked as {column.title.toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>

      {/* Board Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Kanban Board Usage
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Drag and drop todos between columns to update their status</li>
              <li>• Click on any todo card to edit details and assignments</li>
              <li>• Completed todos are automatically timestamped</li>
              <li>• Use the list view for detailed filtering and search</li>
            </ul>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}