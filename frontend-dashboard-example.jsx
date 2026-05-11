// Dashboard.jsx - Frontend Component Example
// Place this in your frontend project (Vercel)

import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalRevenue: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stats from backend on page load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get auth token from localStorage
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading dashboard statistics...</p>
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
      <h2>Super Admin Dashboard</h2>
      
      <div className="stats-grid">
        {/* Total Schools Card */}
        <div className="stat-card">
          <div className="stat-icon">
            🏫
          </div>
          <div className="stat-content">
            <h3>Total Schools</h3>
            <p className="stat-number">{loading ? 'Loading...' : stats.totalSchools}</p>
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
              {loading ? 'Loading...' : `NGN ${stats.totalRevenue.toLocaleString()}`}
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
            <p className="stat-number">{loading ? 'Loading...' : stats.totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Add more dashboard content here */}
      <div className="dashboard-actions">
        <button onClick={() => window.location.href = '/admin/schools'}>
          Manage Schools
        </button>
              </div>
    </div>
  );
};

// CSS for the dashboard (add this to your CSS file)
const dashboardStyles = `
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

.dashboard-actions {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.dashboard-actions button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dashboard-actions button:hover {
  background: #0056b3;
}
`;

export default Dashboard;
