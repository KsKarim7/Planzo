import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { axiosInstance } from '../libs/axios';
import toast from 'react-hot-toast';

const AddMemberModal = ({ onClose, onAddMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState('Contributor');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setIsLoading(true);
      
      const response = await axiosInstance.get(
        `/auth/users/search?query=${searchQuery}`
      );
      
      if (response.data.success && response.data.users) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
        toast.error('No users found');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error(error.response?.data?.message || 'Failed to search users');
      setUsers([]);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    onAddMember({
      userId: selectedUser._id,
      role
    });
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setUsers([]);
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 rounded-xl shadow-2xl border border-gray-700/50 p-6 w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Add Member
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
            <label className="block text-gray-200 font-medium mb-2">Find User</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50 placeholder-gray-500"
                placeholder="Search by name or email"
                disabled={!!selectedUser}
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            {isLoading && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            )}

            {users.length > 0 && !selectedUser && (
              <div className="mt-2 bg-gray-900/80 border border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="px-3 py-2 hover:bg-gray-800 cursor-pointer flex items-center border-b border-gray-700/50 last:border-0"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-sm text-white font-medium mr-3">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-200">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="mt-3 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-sm text-white font-medium mr-3">
                    {selectedUser.profileImage ? (
                      <img
                        src={selectedUser.profileImage}
                        alt={selectedUser.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      selectedUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{selectedUser.name}</div>
                    <div className="text-xs text-gray-400">{selectedUser.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {selectedUser && (
            <div>
              <label className="block text-gray-200 font-medium mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50"
              >
                <option value="Contributor">Contributor</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          )}

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
              disabled={!selectedUser}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal; 