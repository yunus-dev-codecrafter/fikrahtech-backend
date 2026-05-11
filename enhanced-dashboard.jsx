// Enhanced Dashboard.jsx - Full Super Admin Dashboard
// Place this in your frontend project (Vercel)

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalRevenue: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    proprietorEmail: '',
    proprietorPassword: '',
    defaultPassword: 'ChangeMe@2026',
    initialSession: '2026/2027',
    initialTerm: 'First Term'
  });

  // Fetch stats from backend on page load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/stats', {
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
        setStats(data.stats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Auto-refresh function
  const refreshStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle school registration
  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Show success notification
        toast.success(`School "${formData.schoolName}" registered successfully!`);
        
        // Close modal and reset form
        setShowModal(false);
        setFormData({
          schoolName: '',
          proprietorEmail: '',
          proprietorPassword: '',
          defaultPassword: 'ChangeMe@2026',
          initialSession: '2026/2027',
          initialTerm: 'First Term'
        });
        
        // Auto-refresh dashboard stats immediately
        await refreshStats();
        toast.success('Dashboard stats updated!');
      } else {
        toast.error(data.message || 'Failed to register school');
      }
    } catch (err) {
      console.error('Error registering school:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" />
      
      <h2>Super Admin Dashboard</h2>
      
      <div className="stats-grid">
        {/* Total Schools Card */}
        <div className="stat-card">
          <div className="stat-icon">
            🏫
          </div>
          <div className="stat-content">
            <h3>Total Schools</h3>
            <p className="stat-number">{stats.totalSchools}</p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="stat-card">
          <div className="stat-icon">
            💰
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-number">
              NGN {stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Students Card */}
        <div className="stat-card">
          <div className="stat-icon">
            👥
          </div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <p className="stat-number">{stats.totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            onClick={() => setShowModal(true)} 
            className="action-button primary"
          >
            Add New School
          </button>
          <button 
            onClick={() => window.location.href = '/session-monitor'}
            className="action-button secondary"
          >
            Session Monitor
          </button>
          <button 
            onClick={() => window.location.href = '/revenue-reports'}
            className="action-button secondary"
          >
            Revenue Reports
          </button>
        </div>
      </div>

      {/* Register School Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Register New School</h3>
            <form onSubmit={handleRegisterSchool}>
              <div className="form-group">
                <label>School Name:</label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter school name"
                />
              </div>

              <div className="form-group">
                <label>Proprietor Email:</label>
                <input
                  type="email"
                  name="proprietorEmail"
                  value={formData.proprietorEmail}
                  onChange={handleInputChange}
                  required
                  placeholder="proprietor@school.com"
                />
              </div>

              <div className="form-group">
                <label>Proprietor Password:</label>
                <input
                  type="password"
                  name="proprietorPassword"
                  value={formData.proprietorPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter password"
                />
              </div>

              <div className="form-group">
                <label>Default Password:</label>
                <input
                  type="password"
                  name="defaultPassword"
                  value={formData.defaultPassword}
                  onChange={handleInputChange}
                  placeholder="Default password for proprietor login"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Initial Session:</label>
                  <select
                    name="initialSession"
                    value={formData.initialSession}
                    onChange={handleInputChange}
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Initial Term:</label>
                  <select
                    name="initialTerm"
                    value={formData.initialTerm}
                    onChange={handleInputChange}
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="btn-primary"
                >
                  {registerLoading ? (
                    <>
                      <span className="spinner"></span>
                      Registering...
                    </>
                  ) : (
                    'Register School'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-loading, .dashboard-error {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          border-left: 4px solid #007bff;
        }

        .stat-icon {
          font-size: 2rem;
          margin-right: 20px;
        }

        .stat-content h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          text-transform: uppercase;
        }

        .stat-number {
          margin: 0;
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }

        .quick-actions {
          margin: 30px 0;
        }

        .quick-actions h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .action-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        .action-button.primary {
          background: #007bff;
          color: white;
        }

        .action-button.primary:hover {
          background: #0056b3;
        }

        .action-button.secondary {
          background: #6c757d;
          color: white;
        }

        .action-button.secondary:hover {
          background: #545b62;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 10px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin-bottom: 20px;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: #555;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #007bff;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 25px;
        }

        .btn-cancel {
          padding: 10px 20px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .btn-primary {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
