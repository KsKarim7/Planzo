import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Calendar, Clock, AlertTriangle, CheckCircle, Users, Edit, Search, Filter, RefreshCw, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateTaskModal from '../components/CreateTaskModal';
import EditTaskModal from '../components/EditTaskModal';

const ProjectTasksPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data');
        console.log(`API URL: ${import.meta.env.VITE_API_URL}/api/auth/me`);
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        
        console.log('User data response:', response.data);
        
        // Make sure we're getting the correct user ID
        const id = response.data.user?._id || response.data._id;
        console.log('Setting user ID to:', id);
        setUserId(id);
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.error('Error details:', error.response?.data);
        toast.error('Failed to load user data');
      }
    };

    fetchUserData();
    // Only fetch project data after we have the user ID
    if (userId) {
      fetchProjectData();
    }
  }, [projectId, userId]);

  useEffect(() => {
    if (project) {
      fetchTasks();
    }
  }, [project]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching project data for ID: ${projectId}`);
      console.log(`API URL: ${import.meta.env.VITE_API_URL}/api/projects/${projectId}`);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
        withCredentials: true,
      });
      
      console.log('Project data response:', response.data);
      setProject(response.data.project);
      
      // Check if current user is the owner
      const ownerMember = response.data.project.members.find(
        member => member.role === 'Owner'
      );
      
      console.log('Owner member:', ownerMember);
      console.log('Current user ID:', userId);
      
      if (ownerMember && userId) {
        const isCurrentUserOwner = ownerMember.user._id === userId;
        console.log('Is current user the owner?', isCurrentUserOwner);
        setIsOwner(isCurrentUserOwner);
      }
      
    } catch (error) {
      console.error('Error fetching project:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load project details');
      navigate('/tasks');
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      console.log(`Fetching tasks for project: ${projectId}`);
      console.log(`API URL: ${import.meta.env.VITE_API_URL}/api/projects/${projectId}/tasks`);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/tasks`, {
        withCredentials: true,
      });
      
      console.log('Tasks response:', response.data);
      setTasks(response.data.tasks || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load tasks');
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      console.log('Creating task with data:', taskData);
      console.log(`API URL: ${import.meta.env.VITE_API_URL}/api/projects/${projectId}/tasks`);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/tasks`,
        taskData,
        { withCredentials: true }
      );
      
      console.log('Create task response:', response.data);
      toast.success('Task created successfully');
      fetchTasks();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      console.log('Updating task with data:', taskData);
      console.log(`Task ID: ${taskId}`);
      
      // Ensure the correct API URL structure
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/tasks/${taskId}`;
      console.log(`Sending PATCH request to: ${apiUrl}`);
      
      const response = await axios.patch(
        apiUrl,
        taskData,
        { withCredentials: true }
      );
      
      console.log('Update task response:', response.data);
      toast.success('Task updated successfully');
      fetchTasks();
      setIsEditModalOpen(false);
      setCurrentTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      
      if (error.response) {
        toast.error(`Failed to update task: ${error.response.data?.message || error.response.statusText}`);
      } else {
        toast.error(`Network error: ${error.message}`);
      }
    }
  };

  const openEditModal = (task) => {
    setCurrentTask(task);
    setIsEditModalOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-900/50 text-red-300';
      case 'Medium':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'Low':
        return 'bg-green-900/50 text-green-300';
      default:
        return 'bg-gray-700/50 text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Assigned':
        return <Calendar size={16} className="mr-1" />;
      case 'Ongoing':
        return <Clock size={16} className="mr-1" />;
      case 'Completed':
        return <CheckCircle size={16} className="mr-1" />;
      default:
        return null;
    }
  };

  const filterTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const assignedTasks = filterTasksByStatus('Assigned');
  const ongoingTasks = filterTasksByStatus('Ongoing');
  const completedTasks = filterTasksByStatus('Completed');

  const TaskStatusDropdown = ({ task, currentStatus }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const statusOptions = [
      { value: 'Assigned', label: 'Move to Assigned', color: 'bg-blue-900/50 text-blue-300' },
      { value: 'Ongoing', label: 'Move to Ongoing', color: 'bg-yellow-900/50 text-yellow-300' },
      { value: 'Completed', label: 'Move to Completed', color: 'bg-green-900/50 text-green-300' }
    ];

    // Filter out current status
    const availableOptions = statusOptions.filter(option => option.value !== currentStatus);

    const moveTaskToColumn = async (taskId, column) => {
      try {
        console.log(`Moving task ${taskId} to column ${column}`);
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/kanban/task/${taskId}/move`;
        console.log(`Sending PUT request to: ${apiUrl}`);
        
        const response = await axios.put(
          apiUrl,
          { column },
          { withCredentials: true }
        );
        
        console.log('Move task response:', response.data);
        toast.success(`Task moved to ${column}`);
        fetchTasks();
      } catch (error) {
        console.error('Error moving task:', error);
        console.error('Error response data:', error.response?.data);
        toast.error(`Failed to move task: ${error.response?.data?.message || error.message}`);
      }
    };

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`text-xs px-2 py-1 ${
            currentStatus === 'Assigned' ? 'bg-indigo-900/50 text-indigo-300' :
            currentStatus === 'Ongoing' ? 'bg-yellow-900/50 text-yellow-300' :
            'bg-green-900/50 text-green-300'
          } rounded hover:opacity-80 transition-colors flex items-center`}
        >
          {currentStatus === 'Assigned' ? 'Start Task' : 
           currentStatus === 'Ongoing' ? 'Complete' : 'Reopen'}
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute right-0 bottom-full mb-1 bg-gray-800 rounded-md shadow-lg z-10 py-1 min-w-[120px] border border-gray-700">
            {availableOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  moveTaskToColumn(task._id, option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs ${option.color} hover:bg-gray-700 transition-colors`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTaskCard = (task, status) => {
    return (
      <div
        key={task._id}
        className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50"
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-200">{task.title}</h4>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(task);
            }}
            className="text-gray-400 hover:text-blue-400 transition-colors p-1"
          >
            <Edit size={14} />
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Users size={14} className="text-gray-400 mr-1" />
            <span className="text-gray-300 text-xs">
              {task.assignee.name}
            </span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {status === 'Completed' 
              ? `Completed: ${new Date(task.updatedAt).toLocaleDateString()}`
              : `Due: ${new Date(task.dueDate).toLocaleDateString()}`
            }
          </div>
          <TaskStatusDropdown task={task} currentStatus={status} />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Project
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/reports/project/${projectId}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <FileText size={18} /> Reports
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} /> New Task
            </button>
          </div>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                {project.name} - Tasks
              </h1>
              <p className="text-gray-300 mb-4">{project.description || 'No description'}</p>
            </div>
            <div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg"
              >
                <Plus size={18} />
                Create Task
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Project Members</h2>
          <div className="bg-gray-800/60 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Create a Map to track unique members by ID
                const uniqueMembers = new Map();
                
                // Add project members
                project.members.forEach(member => {
                  uniqueMembers.set(member.user._id, {
                    user: member.user,
                    role: member.role,
                    isProjectMember: true
                  });
                });
                
                // Add team members if they exist
                if (project.teams && project.teams.length > 0) {
                  project.teams.forEach(team => {
                    if (team.members && team.members.length > 0) {
                      team.members.forEach(member => {
                        // Only add if not already in the map
                        if (!uniqueMembers.has(member.user._id)) {
                          uniqueMembers.set(member.user._id, {
                            user: member.user,
                            role: `Team: ${team.name}`,
                            isTeamMember: true,
                            teamName: team.name
                          });
                        }
                      });
                    }
                  });
                }
                
                // Convert map to array and render
                return Array.from(uniqueMembers.values()).map((memberData) => (
                  <div
                    key={memberData.user._id}
                    className="flex items-center bg-gray-700/50 rounded-full px-3 py-1"
                  >
                    <div className="h-6 w-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-medium mr-2">
                      {memberData.user.profileImage ? (
                        <img
                          src={memberData.user.profileImage}
                          alt={memberData.user.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        memberData.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm text-gray-200">{memberData.user.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      memberData.isProjectMember ? (
                        memberData.role === 'Owner'
                          ? 'bg-purple-900/50 text-purple-300'
                          : memberData.role === 'Manager'
                          ? 'bg-blue-900/50 text-blue-300'
                          : 'bg-gray-800/50 text-gray-300'
                      ) : 'bg-indigo-900/50 text-indigo-300'
                    }`}>
                      {memberData.role}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Assigned Tasks Column */}
          <div className="bg-gray-800/60 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-4">
            <div className="flex items-center mb-4">
              <Calendar size={18} className="text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-200">Assigned</h3>
              <span className="ml-2 bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded-full">
                {assignedTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {assignedTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No assigned tasks</div>
              ) : (
                assignedTasks.map(task => renderTaskCard(task, 'Assigned'))
              )}
            </div>
          </div>

          {/* Ongoing Tasks Column */}
          <div className="bg-gray-800/60 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-4">
            <div className="flex items-center mb-4">
              <Clock size={18} className="text-yellow-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-200">Ongoing</h3>
              <span className="ml-2 bg-yellow-900/50 text-yellow-300 text-xs px-2 py-0.5 rounded-full">
                {ongoingTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {ongoingTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No ongoing tasks</div>
              ) : (
                ongoingTasks.map(task => renderTaskCard(task, 'Ongoing'))
              )}
            </div>
          </div>

          {/* Completed Tasks Column */}
          <div className="bg-gray-800/60 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-4">
            <div className="flex items-center mb-4">
              <CheckCircle size={18} className="text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-200">Completed</h3>
              <span className="ml-2 bg-green-900/50 text-green-300 text-xs px-2 py-0.5 rounded-full">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No completed tasks</div>
              ) : (
                completedTasks.map(task => renderTaskCard(task, 'Completed'))
              )}
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTask={handleCreateTask}
          projectMembers={project.members}
          projectTeams={project.teams}
        />
      )}

      {isEditModalOpen && currentTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentTask(null);
          }}
          onUpdateTask={handleUpdateTask}
          task={currentTask}
          projectMembers={project.members}
          projectTeams={project.teams}
        />
      )}
    </div>
  );
};

export default ProjectTasksPage; 