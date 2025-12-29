import React, { useState } from 'react';
import { axiosInstance } from '../libs/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.post('/teams/create', formData); // adjust base path if needed
      toast.success(res.data.msg || 'Team created!');
      //navigate(`/teams/${res.data.team._id}`);
    } catch (err) {
      const message = err.response?.data?.msg || 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 pt-40">
      <div className="max-w-md mx-auto p-6 bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6 text-center">
          Create a New Team
        </h2>

        <form onSubmit={handleCreateTeam} className="space-y-5">
          <div>
            <label className="block text-gray-200 font-medium mb-2">Team Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50 placeholder-gray-500"
              placeholder="e.g. Design Team"
            />
          </div>

          <div>
            <label className="block text-gray-200 font-medium mb-2">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 border border-gray-600/50 placeholder-gray-500"
              placeholder="Describe your team's purpose..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Creating Team...' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamPage;
