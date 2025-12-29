import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Briefcase, ChevronRight, Calendar, ListPlus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateProjectModal from '../components/CreateProjectModal';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching projects from: ${import.meta.env.VITE_API_URL}/api/projects`);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
        withCredentials: true,
      });
      
      console.log('Projects response:', response.data);
      
      if (response.data.projects && Array.isArray(response.data.projects)) {
        console.log(`Found ${response.data.projects.length} projects`);
        setProjects(response.data.projects);
      } else {
        console.warn('Projects data is not in expected format:', response.data);
        setProjects([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load projects');
      setProjects([]);
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      console.log('Creating project with data:', projectData);
      console.log(`API URL: ${import.meta.env.VITE_API_URL}/api/projects`);
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/projects`, projectData, {
        withCredentials: true,
      });
      
      console.log('Create project response:', response.data);
      toast.success('Project created successfully');
      
      if (response.data.project) {
        console.log('Adding new project to state:', response.data.project);
        setProjects(prevProjects => {
          const currentProjects = Array.isArray(prevProjects) ? prevProjects : [];
          return [...currentProjects, response.data.project];
        });
      } else {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleViewProject = (projectId) => {
    console.log('Navigating to project:', projectId);
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-6 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            My Projects
          </h1>
          
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg"
              title="Create multiple projects in succession"
            >
              <ListPlus size={18} />
              Create Multiple Projects
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg"
            >
              <Plus size={18} />
              Create Project
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : !Array.isArray(projects) || projects.length === 0 ? (
          <div className="bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 p-10 text-center">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-200 mb-2">No Projects Yet</h3>
            <p className="text-gray-400 mb-6">Create your first project to get started</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 inline-flex items-center gap-2"
              >
                <ListPlus size={18} />
                Create Multiple Projects
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Create Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-gray-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => handleViewProject(project._id)}
              >
                <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3">
                  {project.name}
                </h3>
                <p className="text-gray-400 mb-4 line-clamp-2">{project.description || 'No description'}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {project.members?.length || 0} members
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {project.teams?.length || 0} teams
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {project.tasks?.length || 0} tasks
                  </span>
                </div>
                
                <div className="flex justify-end">
                  <ChevronRight size={20} className="text-purple-400 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreateProject={handleCreateProject}
        />
      )}
    </div>
  );
};

export default ProjectsPage; 