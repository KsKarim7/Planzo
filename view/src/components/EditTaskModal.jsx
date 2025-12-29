import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

const EditTaskModal = ({ isOpen, onClose, onUpdateTask, task, projectMembers, projectTeams }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Assigned'
  });

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      // Format the date to YYYY-MM-DD for the input field
      const formattedDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigneeId: task.assignee?._id || '',
        dueDate: formattedDate,
        priority: task.priority || 'Medium',
        status: task.status || 'Assigned'
      });
    }
  }, [task]);

  // Use Map to track unique members by ID
  const uniqueMembers = new Map();
  
  // Add project members
  if (projectMembers) {
    projectMembers.forEach(member => {
      uniqueMembers.set(member.user._id, {
        user: member.user,
        role: member.role
      });
    });
  }
  
  // Add team members if they exist
  if (projectTeams && projectTeams.length > 0) {
    projectTeams.forEach(team => {
      if (team.members && team.members.length > 0) {
        team.members.forEach(member => {
          // Only add if not already in the map
          if (!uniqueMembers.has(member.user._id)) {
            uniqueMembers.set(member.user._id, {
              user: member.user,
              role: `Team: ${team.name}`
            });
          }
        });
      }
    });
  }

  // Convert map to array for rendering
  const allMembers = Array.from(uniqueMembers.values());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateTask(task._id, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 rounded-xl shadow-2xl border border-gray-700/50 p-6 w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Edit Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-200 font-medium mb-2">Task Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50 placeholder-gray-500"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-gray-200 font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50 placeholder-gray-500 resize-none"
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label className="block text-gray-200 font-medium mb-2">Assignee</label>
            <select
              name="assigneeId"
              value={formData.assigneeId}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50"
              required
            >
              <option value="">Select Assignee</option>
              {allMembers.map((member) => (
                <option key={member.user._id} value={member.user._id}>
                  {member.user.name} {member.role ? `(${member.role})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-200 font-medium mb-2">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50"
                  required
                />
                <Calendar size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-gray-200 font-medium mb-2">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-200 font-medium mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50"
            >
              <option value="Assigned">Assigned</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal; 