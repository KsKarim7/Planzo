import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../libs/axios';
import { Activity, Search, Filter, Clock, Calendar, User, Briefcase, FileText, MessageSquare, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const ActivityLog = ({ projectId }) => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchActivityLogs();
  }, [projectId, currentPage]);

  const fetchActivityLogs = async () => {
    try {
      setIsLoading(true);
      let url = `/activity/project/${projectId}?page=${currentPage}`;
      
      // Add filters if they exist
      if (filters.entityType) url += `&entityType=${filters.entityType}`;
      if (filters.action) url += `&action=${filters.action}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;
      
      const response = await axiosInstance.get(url);
      
      setActivityLogs(response.data.logs || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs. Please try again.');
      toast.error('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    fetchActivityLogs();
  };

  const resetFilters = () => {
    setFilters({
      entityType: '',
      action: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    fetchActivityLogs();
  };

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
      case 'Commented': return 'text-yellow-400';
      case 'Assigned': return 'text-indigo-400';
      default: return 'text-gray-400';
    }
  };

  // Get entity icon for activity logs
  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'Task': return <Clock className="text-blue-400" size={18} />;
      case 'Project': return <Briefcase className="text-indigo-400" size={18} />;
      case 'Comment': return <MessageSquare className="text-yellow-400" size={18} />;
      case 'Attachment': return <FileText className="text-green-400" size={18} />;
      case 'User': return <User className="text-purple-400" size={18} />;
      case 'Team': return <User className="text-orange-400" size={18} />;
      default: return <Activity className="text-gray-400" size={18} />;
    }
  };

  if (isLoading && activityLogs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && activityLogs.length === 0) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-white p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="activity-log">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Activity Log</h2>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
          >
            <Filter size={18} />
          </button>
          <button 
            onClick={() => {
              setCurrentPage(1);
              fetchActivityLogs();
            }}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-800/80 backdrop-blur-md rounded-lg border border-gray-700/50 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Entity Type</label>
              <select 
                name="entityType" 
                value={filters.entityType} 
                onChange={handleFilterChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="Task">Task</option>
                <option value="Project">Project</option>
                <option value="Comment">Comment</option>
                <option value="Attachment">Attachment</option>
                <option value="User">User</option>
                <option value="Team">Team</option>
              </select>
            </div>
            
            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Action</label>
              <select 
                name="action" 
                value={filters.action} 
                onChange={handleFilterChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Actions</option>
                <option value="Created">Created</option>
                <option value="Updated">Updated</option>
                <option value="Deleted">Deleted</option>
                <option value="Completed">Completed</option>
                <option value="Commented">Commented</option>
                <option value="Assigned">Assigned</option>
              </select>
            </div>
            
            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 gap-2">
            <button 
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Reset
            </button>
            <button 
              onClick={applyFilters}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Activity Logs List */}
      <div className="bg-gray-800/80 backdrop-blur-md rounded-lg border border-gray-700/50 p-5 shadow-lg">
        {activityLogs.length > 0 ? (
          <div className="space-y-4">
            {activityLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-700/50">
                <div className="bg-gray-700/50 p-2 rounded-full">
                  {getEntityIcon(log.entityType)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">
                      {log.userId?.name || 'User'}
                    </span>
                    <span className={`${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-gray-400">
                      {log.entityType}
                    </span>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {Object.entries(log.details)
                          .filter(([key, value]) => key !== 'projectId' && value !== null)
                          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
                          .join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No activity logs found</p>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog; 