import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Briefcase, Plus, ArrowLeft, Edit, Trash2, KanbanSquare, Calendar, BarChart3, Activity, FileText } from 'lucide-react';
import { axiosInstance } from '../libs/axios';
import toast from 'react-hot-toast';
import AddMemberModal from '../components/AddMemberModal';
import AddTeamModal from '../components/AddTeamModal';
import EditProjectModal from '../components/EditProjectModal';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import ProjectDashboard from '../components/ProjectDashboard';
import ActivityLog from '../components/ActivityLog';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, kanban, calendar, activity
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get(`/auth/me`);
        const id = response.data.user?._id || response.data._id;
        setUserId(id);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      }
    };

    fetchUserData();
    // Only fetch project data after we have the user ID
    if (userId) {
      fetchProjectData();
    }
  }, [projectId, userId]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/projects/${projectId}`);
      setProject(response.data.project);

      // Check if current user is the owner
      const ownerMember = response.data.project.members.find(
        member => member.role === 'Owner'
      );

      if (ownerMember && userId) {
        const isCurrentUserOwner = ownerMember.user._id === userId;
        setIsOwner(isCurrentUserOwner);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project details');
      navigate('/projects');
      setIsLoading(false);
    }
  };

  const handleAddMember = async (userData) => {
    try {
      await axiosInstance.post(
        `/projects/${projectId}/members`,
        userData
      );

      toast.success('Member added successfully');
      fetchProjectData();
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        console.log(`Removing member with user ID: ${userId}`);

        const response = await axiosInstance.delete(
          `/projects/${projectId}/members/${userId}`
        );

        console.log('Remove member response:', response.data);
        toast.success('Member removed successfully');
        fetchProjectData();
      } catch (error) {
        console.error('Error removing member:', error);
        console.error('Error details:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const handleAddTeam = async (teamData) => {
    try {
      await axiosInstance.post(
        `/projects/${projectId}/teams`,
        teamData
      );

      toast.success('Team added successfully');
      fetchProjectData();
      setIsAddTeamModalOpen(false);
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error(error.response?.data?.message || 'Failed to add team');
    }
  };

  const handleRemoveTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to remove this team?')) {
      try {
        await axiosInstance.delete(
          `/projects/${projectId}/teams/${teamId}`
        );

        toast.success('Team removed successfully');
        fetchProjectData();
      } catch (error) {
        console.error('Error removing team:', error);
        toast.error(error.response?.data?.message || 'Failed to remove team');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Projects
        </button>

        <div className="bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                {project.name}
              </h1>
              <p className="text-gray-300 mb-4">{project.description || 'No description'}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/reports/project/${projectId}`)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 shadow-lg"
              >
                <FileText size={16} />
                Reports
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700/50"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                        try {
                          await axiosInstance.delete(`/projects/${projectId}`);
                          toast.success('Project deleted successfully');
                          navigate('/projects');
                        } catch (error) {
                          console.error('Error deleting project:', error);
                          toast.error(error.response?.data?.message || 'Failed to delete project');
                        }
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-700/50"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          {/* Main navigation tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'members'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-200'
                }`}
              onClick={() => setActiveTab('members')}
            >
              <Users size={18} />
              Members
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'teams'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-200'
                }`}
              onClick={() => setActiveTab('teams')}
            >
              <Briefcase size={18} />
              Teams
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'views'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-200'
                }`}
              onClick={() => {
                setActiveTab('views');
                setActiveView('dashboard');
              }}
            >
              <BarChart3 size={18} />
              Views
            </button>
          </div>

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-200">Project Members</h2>
                {isOwner && (
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 shadow-lg"
                  >
                    <Plus size={16} />
                    Add Member
                  </button>
                )}
              </div>

              <div className="bg-gray-800/80 backdrop-blur-md rounded-lg border border-gray-700/50 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      {isOwner && (
                        <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {project.members.map((member) => (
                      <tr key={member._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {member.user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {member.user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'Owner'
                              ? 'bg-purple-900/50 text-purple-200'
                              : member.role === 'Manager'
                                ? 'bg-blue-900/50 text-blue-200'
                                : 'bg-gray-700 text-gray-200'
                              }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        {isOwner && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {member.role !== 'Owner' && (
                              <button
                                onClick={() => handleRemoveMember(member.user._id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-200">Project Teams</h2>
                {isOwner && (
                  <button
                    onClick={() => setIsAddTeamModalOpen(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 shadow-lg"
                  >
                    <Plus size={16} />
                    Add Team
                  </button>
                )}
              </div>

              {project.teams && project.teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.teams.map((team) => (
                    <div
                      key={team._id}
                      className="bg-gray-800/80 backdrop-blur-md rounded-lg border border-gray-700/50 p-4 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">{team.name}</h3>
                          <p className="text-sm text-gray-400">
                            {team.members?.length || 0} members
                          </p>
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleRemoveTeam(team._id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700/50 p-8 text-center">
                  <p className="text-gray-400">No teams added to this project yet.</p>
                  {isOwner && (
                    <button
                      onClick={() => setIsAddTeamModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                    >
                      Add a team
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Views Tab */}
          {activeTab === 'views' && (
            <div>
              {/* Views Navigation */}
              <div className="flex mb-6 bg-gray-800/80 backdrop-blur-md rounded-lg border border-gray-700/50 p-1">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${activeView === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  onClick={() => setActiveView('dashboard')}
                >
                  <BarChart3 size={18} />
                  Dashboard
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${activeView === 'kanban'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  onClick={() => setActiveView('kanban')}
                >
                  <KanbanSquare size={18} />
                  Kanban
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${activeView === 'calendar'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  onClick={() => setActiveView('calendar')}
                >
                  <Calendar size={18} />
                  Calendar
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${activeView === 'activity'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  onClick={() => setActiveView('activity')}
                >
                  <Activity size={18} />
                  Activity
                </button>
              </div>

              {/* View Content */}
              {activeView === 'dashboard' && <ProjectDashboard projectId={projectId} />}
              {activeView === 'kanban' && <KanbanBoard projectId={projectId} />}
              {activeView === 'calendar' && <CalendarView projectId={projectId} />}
              {activeView === 'activity' && <ActivityLog projectId={projectId} />}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isAddMemberModalOpen && (
        <AddMemberModal
          onClose={() => setIsAddMemberModalOpen(false)}
          onAddMember={handleAddMember}
        />
      )}

      {isAddTeamModalOpen && (
        <AddTeamModal
          onClose={() => setIsAddTeamModalOpen(false)}
          onAddTeam={handleAddTeam}
        />
      )}

      {isEditModalOpen && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={project}
          onUpdateProject={async (updatedFields) => {
            try {
              await axiosInstance.put(`/projects/${projectId}`, updatedFields);
              toast.success('Project updated successfully');
              setIsEditModalOpen(false);
              fetchProjectData();
            } catch (error) {
              console.error('Error updating project:', error);
              toast.error(error.response?.data?.message || 'Failed to update project');
            }
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage; 