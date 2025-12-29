import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { axiosInstance } from '../libs/axios';
import toast from 'react-hot-toast';

const AddTeamModal = ({ onClose, onAddTeam }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchTeams();
    } else {
      setTeams([]);
    }
  }, [searchQuery]);

  const searchTeams = async () => {
    try {
      setIsLoading(true);
      
      const response = await axiosInstance.get(
        `/teams/search?query=${searchQuery}`
      );
      
      if (response.data.success && response.data.teams) {
        setTeams(response.data.teams);
      } else {
        setTeams([]);
        toast.error('No teams found');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error searching teams:', error);
      toast.error(error.response?.data?.message || 'Failed to search teams');
      setTeams([]);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }

    onAddTeam({
      teamId: selectedTeam._id
    });
  };

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    setTeams([]);
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 rounded-xl shadow-2xl border border-gray-700/50 p-6 w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Add Team
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
            <label className="block text-gray-200 font-medium mb-2">Find Team</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50 placeholder-gray-500"
                placeholder="Search by team name"
                disabled={!!selectedTeam}
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            {isLoading && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            )}

            {teams.length > 0 && !selectedTeam && (
              <div className="mt-2 bg-gray-900/80 border border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                {teams.map((team) => (
                  <div
                    key={team._id}
                    className="px-3 py-2 hover:bg-gray-800 cursor-pointer border-b border-gray-700/50 last:border-0"
                    onClick={() => handleSelectTeam(team)}
                  >
                    <div className="text-sm font-medium text-gray-200">{team.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{team.description || 'No description'}</div>
                  </div>
                ))}
              </div>
            )}

            {selectedTeam && (
              <div className="mt-3 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 flex justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-200">{selectedTeam.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{selectedTeam.description || 'No description'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="text-red-400 hover:text-red-300 transition-colors self-start"
                >
                  <X size={16} />
                </button>
              </div>
            )}
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
              disabled={!selectedTeam}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamModal; 