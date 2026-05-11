// Session Monitor.jsx - Independent Nigerian Calendars
// Place this in your frontend project (Vercel)

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const SessionMonitor = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch schools with their academic sessions
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
        
        // Fetch academic sessions for each school
        const schoolsWithSessions = await Promise.all(
          data.schools.map(async (school) => {
            try {
              const sessionResponse = await fetch(
                `https://fikrahtech-backend.onrender.com/api/admin/schools/${school.id}/sessions`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  }
                }
              );

              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                return {
                  ...school,
                  currentSession: sessionData.currentSession || school.current_session,
                  currentTerm: sessionData.currentTerm || school.current_term,
                  sessionStatus: sessionData.status || 'active'
                };
              }
              return {
                ...school,
                currentSession: school.current_session,
                currentTerm: school.current_term,
                sessionStatus: 'active'
              };
            } catch (err) {
              console.error(`Error fetching sessions for school ${school.id}:`, err);
              return {
                ...school,
                currentSession: school.current_session,
                currentTerm: school.current_term,
                sessionStatus: 'active'
              };
            }
          })
        );

        setSchools(schoolsWithSessions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schools:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Update school session/term
  const updateSchoolSession = async (schoolId, session, term) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `https://fikrahtech-backend.onrender.com/api/admin/schools/${schoolId}/session`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ session, term })
        }
      );

      if (response.ok) {
        toast.success('School session updated successfully');
        
        // Refresh the data
        const updatedSchools = schools.map(school => 
          school.id === schoolId 
            ? { ...school, currentSession: session, currentTerm: term }
            : school
        );
        setSchools(updatedSchools);
      } else {
        toast.error('Failed to update school session');
      }
    } catch (err) {
      console.error('Error updating school session:', err);
      toast.error('Network error. Please try again.');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#28a745';
      case 'inactive':
        return '#dc3545';
      case 'suspended':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="session-monitor-loading">
        <div className="spinner"></div>
        <p>Loading session data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-monitor-error">
        <p>Error loading session data: {error}</p>
      </div>
    );
  }

  return (
    <div className="session-monitor-container">
      <Toaster position="top-right" />
      
      <div className="header">
        <h2>Session Monitor</h2>
        <p>Independent academic calendars for each school</p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="back-button"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="schools-table">
        <table>
          <thead>
            <tr>
              <th>School Name</th>
              <th>Current Session</th>
              <th>Current Term</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => (
              <tr key={school.id}>
                <td className="school-name">
                  <strong>{school.name}</strong>
                  {school.is_blocked && (
                    <span className="blocked-badge">Blocked</span>
                  )}
                </td>
                <td>
                  <select
                    value={school.currentSession}
                    onChange={(e) => updateSchoolSession(school.id, e.target.value, school.currentTerm)}
                    className="session-select"
                  >
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </td>
                <td>
                  <select
                    value={school.currentTerm}
                    onChange={(e) => updateSchoolSession(school.id, school.currentSession, e.target.value)}
                    className="term-select"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(school.sessionStatus) }}
                  >
                    {school.sessionStatus || 'active'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => window.location.href = `/schools/${school.id}`}
                    className="view-button"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {schools.length === 0 && (
          <div className="no-schools">
            <p>No schools found. Register your first school to get started.</p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="add-school-button"
            >
              Add First School
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .session-monitor-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 30px;
        }

        .header h2 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .header p {
          margin: 0 0 20px 0;
          color: #666;
        }

        .back-button {
          padding: 8px 16px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .back-button:hover {
          background: #545b62;
        }

        .session-monitor-loading,
        .session-monitor-error {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .schools-table {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }

        td {
          padding: 15px;
          border-bottom: 1px solid #dee2e6;
        }

        tr:hover {
          background: #f8f9fa;
        }

        .school-name {
          font-weight: 500;
        }

        .blocked-badge {
          display: inline-block;
          margin-left: 10px;
          padding: 2px 8px;
          background: #dc3545;
          color: white;
          border-radius: 12px;
          font-size: 12px;
        }

        .session-select,
        .term-select {
          padding: 8px 12px;
          border: 2px solid #dee2e6;
          border-radius: 5px;
          background: white;
          cursor: pointer;
        }

        .session-select:focus,
        .term-select:focus {
          outline: none;
          border-color: #007bff;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .view-button {
          padding: 6px 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .view-button:hover {
          background: #0056b3;
        }

        .no-schools {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .no-schools p {
          margin-bottom: 20px;
          font-size: 16px;
        }

        .add-school-button {
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .add-school-button:hover {
          background: #0056b3;
        }

        @media (max-width: 768px) {
          .session-monitor-container {
            padding: 10px;
          }

          .schools-table {
            overflow-x: auto;
          }

          table {
            min-width: 600px;
          }

          th, td {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionMonitor;
