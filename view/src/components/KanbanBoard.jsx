import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { axiosInstance } from '../libs/axios';
import { Clock, Calendar, AlertCircle, CheckCircle, MoreVertical, User } from 'lucide-react';
import toast from 'react-hot-toast';

const KanbanBoard = ({ projectId }) => {
  const [columns, setColumns] = useState({
    'Assigned': [],
    'Ongoing': [],
    'Completed': []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchKanbanData();
  }, [projectId]);

  const fetchKanbanData = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/kanban/project/${projectId}`);
      setColumns(response.data.columns);
      setError(null);
    } catch (err) {
      console.error('Error fetching kanban data:', err);
      setError('Failed to load tasks. Please try again.');
      toast.error('Failed to load kanban board');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Create a copy of our columns
    const newColumns = { ...columns };
    
    // Remove task from source column
    const sourceColumn = [...newColumns[source.droppableId]];
    const taskToMove = sourceColumn[source.index];
    sourceColumn.splice(source.index, 1);
    
    // Add task to destination column
    const destColumn = [...newColumns[destination.droppableId]];
    destColumn.splice(destination.index, 0, taskToMove);
    
    // Update columns state with new data
    newColumns[source.droppableId] = sourceColumn;
    newColumns[destination.droppableId] = destColumn;
    
    // Optimistically update UI
    setColumns(newColumns);
    
    try {
      // Update task status on the server
      await axiosInstance.put(`/kanban/task/${taskToMove._id}/move`, {
        column: destination.droppableId
      });
      
      toast.success(`Task moved to ${destination.droppableId}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      
      // Revert back to original state on error
      fetchKanbanData();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getColumnColor = (columnId) => {
    switch (columnId) {
      case 'Assigned': return 'from-gray-700 to-gray-800 border-gray-600';
      case 'Ongoing': return 'from-blue-700/20 to-blue-900/20 border-blue-700/50';
      case 'Completed': return 'from-green-700/20 to-green-900/20 border-green-700/50';
      default: return 'from-gray-700 to-gray-800 border-gray-600';
    }
  };

  const getColumnIcon = (columnId) => {
    switch (columnId) {
      case 'Assigned': return <Clock className="text-gray-400" size={18} />;
      case 'Ongoing': return <AlertCircle className="text-blue-400" size={18} />;
      case 'Completed': return <CheckCircle className="text-green-400" size={18} />;
      default: return <Clock className="text-gray-400" size={18} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-white p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <h2 className="text-xl font-semibold text-white mb-6">Kanban Board</h2>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columns).map(([columnId, tasks]) => (
            <div key={columnId} className="kanban-column">
              <div className={`bg-gradient-to-b ${getColumnColor(columnId)} rounded-lg border p-4 h-full`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getColumnIcon(columnId)}
                    <h3 className="font-medium text-white">{columnId}</h3>
                    <span className="bg-gray-700/50 text-gray-300 text-xs px-2 py-1 rounded-full">
                      {tasks.length}
                    </span>
                  </div>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[300px]"
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 mb-3 shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-white">{task.title}</h4>
                                <button className="text-gray-400 hover:text-white">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                              
                              {task.description && (
                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-1">
                                  <div className="flex -space-x-2">
                                    {task.assignee && (
                                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white border border-gray-800">
                                        {task.assignee.name ? task.assignee.name.charAt(0) : <User size={12} />}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 items-center">
                                  <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></span>
                                  <span className="text-xs text-gray-400">
                                    <Calendar size={12} className="inline mr-1" />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
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
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard; 