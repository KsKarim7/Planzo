import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { User, Mail, Camera, Calendar, UserCircle, Key, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { axiosInstance } from '../libs/axios';

const UserProfile = () => {
  const { authUser, updateAuthUser } = useAuthStore();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: authUser.name || '',
    phone: authUser.phone || '',
    password: '',
    uniqueId: authUser.uniqueId || '',
    dateOfBirth: authUser.dateOfBirth ? new Date(authUser.dateOfBirth).toISOString().split('T')[0] : '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set image preview if user has profile image
  useEffect(() => {
    if (authUser.profileImage) {
      setImagePreview(`${import.meta.env.VITE_API_URL}${authUser.profileImage}`);
    }
  }, [authUser.profileImage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('--- FORM SUBMISSION START ---');
      console.log('Current user data:', authUser);
      
      // Create FormData object for file upload
      const formDataObj = new FormData();
      
      // Add text fields
      if (formData.name) {
        formDataObj.append('name', formData.name);
        console.log('Adding name:', formData.name);
      }
      
      // Ensure phone is treated as a number
      if (formData.phone) {
        const phoneNum = parseInt(formData.phone, 10);
        if (!isNaN(phoneNum)) {
          formDataObj.append('phone', phoneNum);
          console.log('Adding phone (as number):', phoneNum);
        } else {
          formDataObj.append('phone', formData.phone);
          console.log('Adding phone (as string):', formData.phone);
        }
      }
      
      if (formData.password) {
        formDataObj.append('password', formData.password);
        console.log('Adding password: [REDACTED]');
      }
      
      if (formData.uniqueId) {
        formDataObj.append('uniqueId', formData.uniqueId);
        console.log('Adding uniqueId:', formData.uniqueId);
      }
      
      if (formData.dateOfBirth) {
        formDataObj.append('dateOfBirth', formData.dateOfBirth);
        console.log('Adding dateOfBirth:', formData.dateOfBirth);
      }
      
      // Add file if selected
      if (selectedFile) {
        console.log('Adding file:', selectedFile.name, selectedFile.type, selectedFile.size + 'bytes');
        
        // Ensure the file name is clean
        const fileExtension = selectedFile.name.split('.').pop();
        const renamedFile = new File(
          [selectedFile], 
          `profile-image.${fileExtension}`, 
          { type: selectedFile.type }
        );
        
        formDataObj.append('profileImage', renamedFile);
        console.log('File attached with name:', renamedFile.name);
      }

      console.log('Sending update request...');
      
      // For debugging, log the FormData entries
      for (let pair of formDataObj.entries()) {
        if (pair[0] !== 'password' && pair[0] !== 'profileImage') {
          console.log(pair[0] + ': ' + pair[1]);
        } else if (pair[0] === 'profileImage') {
          console.log(pair[0] + ': [File Object]');
        } else {
          console.log(pair[0] + ': [REDACTED]');
        }
      }
      
      // Updated to use the new endpoint without userId parameter
      const res = await axiosInstance.put('/auth/profile', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Response received:', res.status, res.statusText);
      console.log('Response data:', res.data);
      
      // Update auth user in store
      if (res.data.user) {
        console.log('Updating user in store with:', res.data.user);
        updateAuthUser(res.data.user);
        toast.success(res.data?.msg || 'Profile updated successfully');
        
        // Reset password field
        setFormData(prev => ({
          ...prev,
          password: ''
        }));
        
        // Reset file selection
        setSelectedFile(null);
      } else {
        console.error('Server response missing user data:', res.data);
        toast.error('Server response missing user data');
      }
      
      console.log('--- FORM SUBMISSION END ---');
    } catch (err) {
      console.error('Profile update error:', err);
      
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
        toast.error(err.response.data?.msg || 'Update failed');
      } else if (err.request) {
        console.error('No response received:', err.request);
        toast.error('Network error - no response from server');
      } else {
        console.error('Error setting up request:', err.message);
        toast.error('Error setting up request');
      }
      
      console.log('--- FORM SUBMISSION ERROR END ---');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pt-24 px-4">
      <div className="max-w-3xl mx-auto bg-[#1E1E2E] rounded-lg shadow-lg p-8 border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
          <User size={28} /> {`${authUser.name}'s Profile`}
        </h2>

        <div className="flex flex-col md:flex-row gap-8 mb-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center">
            <div 
              className="w-40 h-40 rounded-full bg-gray-800 border-2 border-cyan-500 flex items-center justify-center cursor-pointer overflow-hidden relative mb-2"
              onClick={handleImageClick}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle size={100} className="text-gray-500" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={30} className="text-white" />
              </div>
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button 
              type="button"
              onClick={handleImageClick}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              Change Photo
            </button>
          </div>

          {/* User Info Section */}
          <div className="flex-1">
            <div className="space-y-4 mb-4">
              <div className="flex items-center gap-2">
                <Mail size={20} className="text-cyan-400" />
                <span className="text-gray-300">{authUser.email}</span>
              </div>
              
              {authUser.uniqueId && (
                <div className="flex items-center gap-2">
                  <Key size={20} className="text-cyan-400" />
                  <span className="text-gray-300">ID: {authUser.uniqueId}</span>
                </div>
              )}
              
              {authUser.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={20} className="text-cyan-400" />
                  <span className="text-gray-300">Phone: {authUser.phone}</span>
                </div>
              )}
              
              {authUser.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-cyan-400" />
                  <span className="text-gray-300">
                    Born: {new Date(authUser.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 mb-4">
              <h3 className="font-medium text-cyan-400 mb-1">User Info</h3>
              <p className="text-sm text-gray-400">
                Role: {authUser.role} <br />
                Member since: {new Date(authUser.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 border-t border-gray-700 pt-6">
          <h3 className="text-xl font-semibold text-cyan-400 mb-4">Edit Profile</h3>
          
          {/* Name */}
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Unique ID */}
          <div>
            <label className="block text-sm mb-1">Unique ID (Optional)</label>
            <input
              type="text"
              name="uniqueId"
              value={formData.uniqueId}
              onChange={handleChange}
              placeholder="e.g., UID-123ABC"
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          
          {/* Date of Birth */}
          <div>
            <label className="block text-sm mb-1">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-1">Password (leave blank to keep current)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-md transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
