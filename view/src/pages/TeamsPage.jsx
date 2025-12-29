import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { axiosInstance } from '../libs/axios';
import { Users, Eye } from 'lucide-react';

const TeamsPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axiosInstance.get('/teams/view/joined');
        setTeams(res.data.teams || []);
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 py-20 px-4">
      <div className="max-w-6xl mx-auto mt-5">
        <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-12">
          Your Teams
        </h2>

        {loading ? (
          <p className="text-gray-200 text-center">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p className="text-gray-300 text-center">You're not part of any teams yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teams.map((team) => {
              const owner = team.members.find(m => m.role === 'Owner')?.user;
              return (
                <div
                  key={team._id}
                  className="bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 shadow-lg p-6 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-2">{team.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{team.description || 'No description provided.'}</p>

                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                      <Users size={16} />
                      <span>{team.members.length} members</span>
                    </div>

                    {owner && (
                      <div className="text-sm text-gray-400">
                        Owner: <span className="text-gray-200 font-medium">{owner.name}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/view-team/${team._id}`)}
                    className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                  >
                    <Eye size={18} />
                    View Team
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
