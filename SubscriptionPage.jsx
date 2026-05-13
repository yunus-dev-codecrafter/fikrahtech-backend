// SubscriptionPage.jsx - Subscription Plans Management
// Place this in your frontend project (Vercel)

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Plus, Trash2, Edit } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    interval: 'monthly',
    features: []
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

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Plans</h1>
        <p className="text-gray-600">Manage your subscription plans and pricing</p>
      </div>

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
    </div>
  );
};

export default SubscriptionPage;
