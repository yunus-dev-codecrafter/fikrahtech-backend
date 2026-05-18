// SchoolDetail.jsx - Detailed School Edit Page for Super Admin
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Save, Calendar, Settings, Users } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SchoolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    trial_period_days: 30
  });
  const [settingsData, setSettingsData] = useState({
    current_session: '2023/2024',
    current_term: 'First Term',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    grading_system: '5.0',
    max_students: null
  });

  // Consolidated fetch function
  const fetchSchoolDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://fikrahtech-backend.onrender.com/api/admin/schools/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSchool(data.school);
      setSettings(data.settings);
      
      // Set form data
      setFormData({
        name: data.school.name,
        status: data.school.status,
        trial_period_days: data.school.trial_period_days || 30
      });
      
      if (data.settings) {
        setSettingsData({
          current_session: data.settings.current_session || '2023/2024',
          current_term: data.settings.current_term || 'First Term',
          currency: data.settings.currency || 'NGN',
          timezone: data.settings.timezone || 'Africa/Lagos',
          grading_system: data.settings.grading_system || '5.0',
          max_students: data.settings.max_students || null
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching school details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolDetails();
  }, [id]);

  // Handle generic input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'trial_period_days' ? parseInt(value) || 0 : value
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsData(prev => ({
      ...prev,
      [name]: name === 'max_students' ? (value ? parseInt(value) : null) : value
    }));
  };

  // Handle school update
  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://fikrahtech-backend.onrender.com/api/admin/schools/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('School updated successfully!');
        // Refresh school data
        fetchSchoolDetails();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update school');
      }
    } catch (err) {
      console.error('Error updating school:', err);
      toast.error(err.message || 'Network error');
    }
  };

  // Handle settings update
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://fikrahtech-backend.onrender.com/api/admin/schools/${id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        toast.success('School settings updated successfully!');
        // Refresh school data
        fetchSchoolDetails();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error(err.message || 'Network error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading school details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/admin/schools')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Schools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster />
      
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/schools')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Schools
        </button>
        <div className="flex items-center">
          <Building2 className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{school?.name}</h1>
            <p className="text-gray-600">School ID: {school?.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Information Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Building2 className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">School Information</h2>
          </div>

          <form onSubmit={handleUpdateSchool} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trial Period (Days)
              </label>
              <input
                type="number"
                name="trial_period_days"
                value={formData.trial_period_days}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save School Information
              </button>
            </div>
          </form>
        </div>

        {/* School Settings Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Settings className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">School Settings</h2>
          </div>

          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Session
              </label>
              <input
                type="text"
                name="current_session"
                value={settingsData.current_session}
                onChange={handleSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2023/2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Term
              </label>
              <select
                name="current_term"
                value={settingsData.current_term}
                onChange={handleSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <input
                type="text"
                name="currency"
                value={settingsData.currency}
                onChange={handleSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NGN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <input
                type="text"
                name="timezone"
                value={settingsData.timezone}
                onChange={handleSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Africa/Lagos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grading System
              </label>
              <input
                type="text"
                name="grading_system"
                value={settingsData.grading_system}
                onChange={handleSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students (Optional)
              </label>
              <input
                type="number"
                name="max_students"
                value={settingsData.max_students || ''}
                onChange={handleSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex items-center mb-6">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Subscription Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className={`text-lg font-semibold ${
                school?.is_blocked ? 'text-red-600' : 
                school?.status === 'active' ? 'text-green-600' : 
                'text-yellow-600'
              }`}>
                {school?.is_blocked ? 'Blocked' : school?.status}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Subscription Expiry</p>
              <p className="text-lg font-semibold text-gray-900">
                {school?.subscription_expiry ? new Date(school.subscription_expiry).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Trial Period</p>
              <p className="text-lg font-semibold text-gray-900">
                {school?.trial_period_days || 30} days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetail;
