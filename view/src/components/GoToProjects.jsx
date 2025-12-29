import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';

const GoToProjects = () => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    toast.success("Alavi's section starts from here. Adjust project path");
    // Uncomment and update path when ready:
    // navigate('/projects');
  };

  return (
    <div className="w-full bg-gray-800/80 border border-gray-700 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-blue-300 flex items-center gap-2">
          <LayoutDashboard size={20} />
          Team Projects
        </h3>
        
        <button
          onClick={handleClick}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
        >
          Go to Projects
        </button>
      </div>
      
      <p className="mt-2 text-gray-400">
        All projects associated with this team.
      </p>
    </div>
  );
};

export default GoToProjects;