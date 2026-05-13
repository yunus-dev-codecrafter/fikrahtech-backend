// SubscriptionPage.jsx - Subscription Plans Management
// Place this in your frontend project (Vercel)

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Plus, Trash2, Edit, Building2, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [schools, setSchools] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'subscriptions'
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    interval: 'monthly',
    features: []
  });
  const [assignData, setAssignData] = useState({
    school_id: '',
    plan_id: '',
    duration_months: 12
  });

  // Fetch plans function
  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/plans', {
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
      setPlans(data?.plans || data?.success ? data.plans : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch schools function
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
      toast.error('Failed to fetch schools');
    }
  };

  // Fetch school subscriptions function
  const fetchSchoolSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/school-subscriptions', {
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
      setSubscriptions(data?.subscriptions || []);
    } catch (err) {
      console.error('Error fetching school subscriptions:', err);
      toast.error('Failed to fetch school subscriptions');
    }
  };

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
    fetchSchools();
    fetchSchoolSubscriptions();
    setLoading(false);
  }, []);

  // Handle form submission
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      });

      if (response.ok) {
        toast.success('Plan created successfully!');
        
        // Reset form and refresh plans
        setFormData({
          name: '',
          price: '',
          interval: 'monthly',
          features: []
        });
        setShowCreateForm(false);
        
        // Re-fetch plans
        await fetchPlans();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create plan');
      }
    } catch (err) {
      console.error('Error creating plan:', err);
      toast.error(err.message || 'Network error during plan creation');
    }
  };

  // Handle plan deletion
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://fikrahtech-backend.onrender.com/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Plan deleted successfully!');
        setPlans(plans.filter(plan => plan.id !== planId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete plan');
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      toast.error(err.message || 'Network error during plan deletion');
    }
  };

  // Handle assign subscription to school
  const handleAssignSubscription = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://fikrahtech-backend.onrender.com/api/admin/schools/${assignData.school_id}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_id: parseInt(assignData.plan_id),
          duration_months: parseInt(assignData.duration_months)
        })
      });

      if (response.ok) {
        toast.success('Subscription assigned successfully!');
        
        // Reset form and refresh subscriptions
        setAssignData({
          school_id: '',
          plan_id: '',
          duration_months: 12
        });
        setShowAssignForm(false);
        
        // Re-fetch subscriptions and schools
        await fetchSchoolSubscriptions();
        await fetchSchools();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to assign subscription');
      }
    } catch (err) {
      console.error('Error assigning subscription:', err);
      toast.error(err.message || 'Network error during subscription assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading subscription plans...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage subscription plans and school subscriptions</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Plans
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            School Subscriptions
          </button>
        </nav>
      </div>

      {activeTab === 'plans' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Plans List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Current Plans</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </button>
            </div>

            {plans?.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <CreditCard className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-600">No subscription plans found</p>
                <p className="text-sm text-gray-500 mt-2">Create your first plan to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {plans?.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          NGN {new Intl.NumberFormat().format(plan.price)}
                          <span className="text-sm text-gray-500 font-normal">/{plan.interval}</span>
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit Plan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {plan.features && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {(typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features).map((feature, idx) => (
                            <li key={idx} className="text-sm text-gray-600">{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-600">
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Create Form */}
        {showCreateForm && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Plan</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Basic, Pro, Enterprise"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (NGN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Interval
                  </label>
                  <select
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="termly">Termly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features
                  </label>
                  <textarea
                    value={formData.features.join('\n')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      features: e.target.value.split('\n').filter(f => f.trim()) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="List plan features (one per line)"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - School Subscriptions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">School Subscriptions</h2>
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Subscription
                </button>
              </div>

              {subscriptions?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Building2 className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-gray-600">No school subscriptions found</p>
                  <p className="text-sm text-gray-500 mt-2">Assign a subscription plan to a school to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscriptions?.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sub.school_name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sub.plan_name} (NGN {new Intl.NumberFormat().format(sub.plan_price)}/{sub.plan_interval})
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sub.start_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sub.expiry_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sub.status === 'active' ? 'bg-green-100 text-green-800' : 
                              sub.status === 'expired' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Assign Subscription Form */}
          {showAssignForm && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Assign Subscription</h2>
                  <button
                    onClick={() => setShowAssignForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAssignSubscription} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select School
                    </label>
                    <select
                      value={assignData.school_id}
                      onChange={(e) => setAssignData({ ...assignData, school_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose a school...</option>
                      {schools?.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Plan
                    </label>
                    <select
                      value={assignData.plan_id}
                      onChange={(e) => setAssignData({ ...assignData, plan_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose a plan...</option>
                      {plans?.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - NGN {new Intl.NumberFormat().format(plan.price)}/{plan.interval}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (Months)
                    </label>
                    <input
                      type="number"
                      value={assignData.duration_months}
                      onChange={(e) => setAssignData({ ...assignData, duration_months: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Assign
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssignForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
