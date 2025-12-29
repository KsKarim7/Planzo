import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../libs/axios';
import { CheckCircle, Clock, AlertCircle, Calendar, Users, BarChart3, PieChart, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const ProjectDashboard = ({ projectId }) => {
  const [dashboardData, setDashboardData] = useState({
    openTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
    members: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [projectId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch project tasks
      const tasksResponse = await axiosInstance.get(`/tasks/project/${projectId}`);
      const tasks = tasksResponse.data.tasks || [];
      
      // Fetch project details (for member count)
      const projectResponse = await axiosInstance.get(`/projects/${projectId}`);
      const project = projectResponse.data.project;
      
      // Fetch recent activity logs
      const activityResponse = await axiosInstance.get(`/activity/project/${projectId}?limit=5`);
      const recentActivity = activityResponse.data.logs || [];
      
      // Calculate dashboard metrics
      const now = new Date();
      const openTasks = tasks.filter(task => task.status !== 'Done').length;
      const completedTasks = tasks.filter(task => task.status === 'Done').length;
      const overdueTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return task.status !== 'Done' && dueDate < now;
      }).length;
      
      setDashboardData({
        openTasks,
        overdueTasks,
        completedTasks,
        totalTasks: tasks.length,
        members: project.members.length,
        recentActivity
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load project dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate completion percentage
  const completionPercentage = dashboardData.totalTasks > 0 
    ? Math.round((dashboardData.completedTasks / dashboardData.totalTasks) * 100) 
    : 0;

  // Format date for activity logs
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get action color for activity logs
  const getActionColor = (action) => {
    switch (action) {
      case 'Created': return 'text-green-400';
      case 'Updated': return 'text-blue-400';
      case 'Deleted': return 'text-red-400';
      case 'Completed': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  // Get entity icon for activity logs
  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'Task': return <Clock size={16} />;
      case 'Project': return <BarChart3 size={16} />;
      case 'Comment': return <Activity size={16} />;
      case 'Attachment': return <Calendar size={16} />;
      case 'User': return <Users size={16} />;
      default: return <Activity size={16} />;
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
    <div className="project-dashboard">
      <h2 className="text-xl font-semibold text-white mb-6">Project Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Open Tasks */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md rounded-lg border border-gray-700/50 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Open Tasks</p>
              <h3 className="text-2xl font-bold text-white mt-1">{dashboardData.openTasks}</h3>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-full">
              <Clock className="text-blue-400" size={24} />
            </div>
          </div>
        </div>
        
        {/* Overdue Tasks */}
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 backdrop-blur-md rounded-lg border border-red-700/30 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overdue Tasks</p>
              <h3 className="text-2xl font-bold text-white mt-1">{dashboardData.overdueTasks}</h3>
            </div>
            <div className="bg-red-900/30 p-3 rounded-full">
              <AlertCircle className="text-red-400" size={24} />
            </div>
          </div>
        </div>
        
        {/* Completed Tasks */}
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 backdrop-blur-md rounded-lg border border-green-700/30 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed Tasks</p>
              <h3 className="text-2xl font-bold text-white mt-1">{dashboardData.completedTasks}</h3>
            </div>
            <div className="bg-green-900/30 p-3 rounded-full">
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>
        </div>
        
        {/* Team Members */}
        <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 backdrop-blur-md rounded-lg border border-indigo-700/30 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Team Members</p>
              <h3 className="text-2xl font-bold text-white mt-1">{dashboardData.members}</h3>
            </div>
            <div className="bg-indigo-900/30 p-3 rounded-full">
              <Users className="text-indigo-400" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div className="bg-gray-800/80 backdrop-blur-md rounded-lg border border-gray-700/50 p-5 shadow-lg lg:col-span-1">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-purple-400" />
            Task Completion
          </h3>
          
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-gray-700"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-purple-500"
                  strokeWidth="3"
                  strokeDasharray="100"
                  strokeDashoffset={100 - completionPercentage}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
                <text
                  x="18"
                  y="18"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="fill-white text-lg font-bold"
                >
                  {completionPercentage}%
                </text>
              </svg>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                {dashboardData.completedTasks} of {dashboardData.totalTasks} tasks completed
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-gray-800/80 backdrop-blur-md rounded-lg border border-gray-700/50 p-5 shadow-lg lg:col-span-2">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            Recent Activity
          </h3>
          
          <div className="space-y-4">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-700/50">
                  <div className="bg-gray-700/50 p-2 rounded-full">
                    {getEntityIcon(activity.entityType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {activity.userId?.name || 'User'}
                      </span>
                      <span className={`${getActionColor(activity.action)}`}>
                        {activity.action}
                      </span>
                      <span className="text-gray-400">
                        {activity.entityType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard; 