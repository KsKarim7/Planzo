import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../libs/axios';
import toast from 'react-hot-toast';
import { Users, Mail, Trash2, Shield, UserPlus } from 'lucide-react';
import GoToProjects from '../components/GoToProjects'; // adjust path if needed

const ViewTeam = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axiosInstance.get(`/teams/view/${teamId}`);
        setTeam(res.data.team);
      } catch (error) {
        toast.error(error.response?.data?.msg || 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamId, refresh]);

  const removeMember = async (memberId) => {
    try {
      await axiosInstance.delete(`/teams/remove/${teamId}/${memberId}`);
      toast.success('Member removed');
      setRefresh(!refresh);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to remove member');
    }
  };

  const assignRole = async (memberId, newRole) => {
    try {
      await axiosInstance.put(`/teams/assign-role/${teamId}/${memberId}`, { newRole });
      toast.success('Role updated');
      setRefresh(!refresh);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to assign role');
    }
  };

  const addMember = async () => {
    try {
      const res = await axiosInstance.post(`/teams/add/${teamId}`, { memberEmail: emailInput });
      toast.success(res.data.msg);
      setEmailInput('');
      setRefresh(!refresh);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add member');
    }
  };

  if (loading) {
    return <div className="text-white text-center pt-40">Loading team...</div>;
  }

  if (!team) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 py-20 px-4">
      <div className="max-w-4xl mt-10 mx-auto bg-gray-800/80 p-6 rounded-xl border border-gray-700 text-white">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-blue-400">{team.name}</h2>
          <p className="text-gray-300 mt-2">{team.description || 'No description provided.'}</p>
          <p className="text-sm text-gray-400 mt-2">Your Role: <span className="text-white font-semibold">{team.viewerRole}</span></p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Users size={18}/> Team Members
          </h3>
          <div className="space-y-3">
            {team.members.map(({ user, role }) => (
              <div key={user._id} className="bg-gray-900/70 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium text-white">
                    {user.name} 
                    <span className={`text-sm ml-2 ${
                      role === 'Owner' ? 'text-yellow-400' : 
                      role === 'Manager' ? 'text-blue-400' : 
                      'text-gray-400'
                    }`}>
                      ({role})
                    </span>
                  </p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                
                {/* Action buttons based on permissions */}
                <div className="flex gap-2">
                  {/* Owner can change roles for all members except themself and other owners */}
                  {team.viewerRole === 'Owner' && role !== 'Owner' && (
                    <select
                      value={role}
                      onChange={(e) => assignRole(user._id, e.target.value)}
                      className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                    >
                      <option value="Contributor">Contributor</option>
                      <option value="Manager">Manager</option>
                    </select>
                  )}

                  {/* Owner can remove anyone except themselves */}
                  {team.viewerRole === 'Owner' && user._id !== team.members.find(m => m.role === 'Owner').user._id && (
                    <button 
                      onClick={() => removeMember(user._id)} 
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/30"
                      title="Remove member"
                    >
                      <Trash2 size={18}/>
                    </button>
                  )}

                  {/* Manager can only remove Contributors */}
                  {team.viewerRole === 'Manager' && role === 'Contributor' && (
                    <button 
                      onClick={() => removeMember(user._id)} 
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/30"
                      title="Remove member"
                    >
                      <Trash2 size={18}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add member section - only visible to Owners and Managers */}
        {(team.viewerRole === 'Owner' || team.viewerRole === 'Manager') && (
          <div className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <UserPlus size={18}/> Add New Member
            </h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-600 placeholder-gray-500"
                placeholder="Enter registered email address..."
              />
              <button
                onClick={addMember}
                disabled={!emailInput}
                className={`${
                  !emailInput 
                    ? 'bg-gray-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                } text-white px-4 py-2 rounded-lg transition-all`}
              >
                Add
              </button>
            </div>
          </div>
        )}
        
        {team && (
          <div className="mt-8 w-full">
            <GoToProjects />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewTeam;