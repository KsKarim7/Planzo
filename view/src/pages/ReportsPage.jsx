import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { 
  FileText, BarChart, Download, Trash2, 
  RefreshCw, Send, Filter, Calendar, Users 
} from 'lucide-react';

const ReportsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Burn Down',
    parameters: {}
  });
  
  // Fetch reports when component mounts
  useEffect(() => {
    fetchReports();
  }, [projectId]);
  
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/reports`,
        { withCredentials: true }
      );
      
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    try {
      setGenerating(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/reports`,
        formData,
        { withCredentials: true }
      );
      
      toast.success('Report generated successfully');
      fetchReports();
      setShowGenerateForm(false);
      setFormData({
        type: 'Burn Down',
        parameters: {}
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };
  
  const handleDownload = async (reportId) => {
    try {
      window.open(
        `${import.meta.env.VITE_API_URL}/api/reports/${reportId}/download?token=${localStorage.getItem('token')}`,
        '_blank'
      );
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };
  
  const handleDelete = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/reports/${reportId}`,
        { withCredentials: true }
      );
      
      toast.success('Report deleted successfully');
      setReports(reports.filter(report => report._id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };
  
  const handleSendWeeklySummary = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/email-summary`,
        {},
        { withCredentials: true }
      );
      
      toast.success('Weekly summary sent successfully');
    } catch (error) {
      console.error('Error sending weekly summary:', error);
      toast.error('Failed to send weekly summary');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'Burn Down':
        return <BarChart className="text-yellow-400" />;
      case 'Task Progress':
        return <FileText className="text-blue-400" />;
      case 'Team Performance':
        return <Users className="text-purple-400" />;
      case 'Time Tracking':
        return <Calendar className="text-green-400" />;
      default:
        return <FileText className="text-gray-400" />;
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Project Reports</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FileText size={18} /> Generate Report
          </button>
          <button
            onClick={handleSendWeeklySummary}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <Send size={18} /> Send Weekly Summary
          </button>
          <button
            onClick={fetchReports}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      
      {showGenerateForm && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Generate New Report</h2>
          <form onSubmit={handleGenerateReport} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Report Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="Burn Down">Burn Down Chart</option>
                <option value="Task Progress">Task Progress</option>
                <option value="Team Performance">Team Performance</option>
                <option value="Time Tracking">Time Tracking</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {generating ? <RefreshCw size={18} className="animate-spin" /> : <FileText size={18} />} 
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Reports Yet</h3>
          <p className="text-gray-400 mb-6">Generate your first report to track project progress</p>
          <button
            onClick={() => setShowGenerateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Report
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => (
            <div key={report._id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-700 rounded-lg">
                  {getReportTypeIcon(report.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{report.type}</h3>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>Generated: {formatDate(report.generatedAt)}</span>
                    <span>By: {report.createdBy?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(report._id)}
                  className="p-2 bg-green-600/80 text-white rounded-lg hover:bg-green-600 transition-colors"
                  title="Download Report"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => handleDelete(report._id)}
                  className="p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Delete Report"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage; 