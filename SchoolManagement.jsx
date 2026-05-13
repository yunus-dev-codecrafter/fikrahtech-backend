// SchoolManagement.jsx - School Management for Super Admin
import React, { useState, useEffect } from 'react';
import { Building2, Edit, Ban, Unlock, Trash2, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SchoolManagement = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/schools', {
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
        setSchools(data?.schools || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schools:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Handle block/unblock school
  const handleToggleBlock = async (schoolId, schoolName, isBlocked) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://fikrahtech-backend.onrender.com/api/admin/schools/${schoolId}/toggle-block`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success(`School ${isBlocked ? 'unblocked' : 'blocked'} successfully!`);
        // Refresh schools list
        fetchSchools();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update school status');
      }
    } catch (err) {
      console.error('Error toggling school block:', err);
      toast.error(err.message || 'Network error');
    }
  };

  // Handle delete school
  const handleDeleteSchool = async (schoolId, schoolName) => {
    if (!window.confirm(`Are you sure you want to delete ${schoolName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://fikrahtech-backend.onrender.com/api/admin/schools/${schoolId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('School deleted successfully!');
        setSchools(schools.filter(school => school.id !== schoolId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete school');
      }
    } catch (err) {
      console.error('Error deleting school:', err);
      toast.error(err.message || 'Network error');
    }
  };

  // Refresh schools function
  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/schools', {
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
      setSchools(data?.schools || []);
    } catch (err) {
      console.error('Error fetching schools:', err);
      toast.error('Failed to refresh schools');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading schools...</p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">School Management</h1>
        <p className="text-gray-600">Manage all registered schools</p>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">All Schools</h2>
            <button
              onClick={() => window.location.href = '/admin/schools/new'}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New School
            </button>
          </div>
        </div>

        {schools?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Building2 className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-gray-600">No schools found</p>
            <p className="text-sm text-gray-500 mt-2">Register your first school to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schools?.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">{school.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        school.is_blocked ? 'bg-red-100 text-red-800' : 
                        school.status === 'active' ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {school.is_blocked ? 'Blocked' : school.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {school.subscription_expiry ? new Date(school.subscription_expiry).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {school.trial_period_days || 30} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(school.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => window.location.href = `/admin/schools/${school.id}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit School"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {/* Block/Unblock Button */}
                        <button
                          onClick={() => handleToggleBlock(school.id, school.name, school.is_blocked)}
                          className={school.is_blocked ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'}
                          title={school.is_blocked ? 'Unblock School' : 'Block School'}
                        >
                          {school.is_blocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteSchool(school.id, school.name)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete School"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolManagement;
