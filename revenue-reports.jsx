// Revenue Reports.jsx - Payment Summaries
// Place this in your frontend project (Vercel)

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const RevenueReports = () => {
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, month, year

  // Fetch payment data
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('https://fikrahtech-backend.onrender.com/api/admin/payments', {
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
        setPayments(data.payments || []);
        setTotalRevenue(data.totalRevenue || 0);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments based on selected filter
  const getFilteredPayments = () => {
    const now = new Date();
    
    switch (filter) {
      case 'month':
        return payments.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        });
      case 'year':
        return payments.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate.getFullYear() === now.getFullYear();
        });
      default:
        return payments;
    }
  };

  const filteredPayments = getFilteredPayments();
  const filteredTotal = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  // Export to CSV
  const exportToCSV = () => {
    const csv = [
      ['School Name', 'Amount', 'Date', 'Payment Type', 'Status'],
      ...filteredPayments.map(payment => [
        payment.school_name || 'Unknown',
        payment.amount,
        new Date(payment.created_at).toLocaleDateString(),
        payment.payment_type || 'Unknown',
        payment.status || 'completed'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="revenue-loading">
        <div className="spinner"></div>
        <p>Loading revenue data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revenue-error">
        <p>Error loading revenue data: {error}</p>
      </div>
    );
  }

  return (
    <div className="revenue-reports-container">
      <Toaster position="top-right" />
      
      <div className="header">
        <h2>Revenue Reports</h2>
        <p>Payment summaries and financial analytics</p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="back-button"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <h3>Total Revenue</h3>
          <p className="amount">NGN {totalRevenue.toLocaleString()}</p>
          <span className="period">All Time</span>
        </div>
        
        <div className="summary-card filtered">
          <h3>Filtered Revenue</h3>
          <p className="amount">NGN {filteredTotal.toLocaleString()}</p>
          <span className="period">
            {filter === 'month' ? 'This Month' : filter === 'year' ? 'This Year' : 'All Time'}
          </span>
        </div>

        <div className="summary-card count">
          <h3>Transactions</h3>
          <p className="count">{filteredPayments.length}</p>
          <span className="period">Total Count</span>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="controls">
        <div className="filter-group">
          <label>Filter by:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        
        <button onClick={exportToCSV} className="export-button">
          📊 Export to CSV
        </button>
      </div>

      {/* Payments Table */}
      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>School</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td className="school-name">{payment.school_name || 'Unknown'}</td>
                <td className="amount">NGN {parseFloat(payment.amount).toLocaleString()}</td>
                <td className="date">
                  {new Date(payment.created_at).toLocaleDateString()}
                </td>
                <td className="type">{payment.payment_type || 'Unknown'}</td>
                <td className="status">
                  <span className={`status-badge ${payment.status || 'completed'}`}>
                    {payment.status || 'completed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPayments.length === 0 && (
          <div className="no-payments">
            <p>No payments found for the selected filter.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .revenue-reports-container {
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

        .revenue-loading,
        .revenue-error {
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

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .summary-card.total {
          border-left: 4px solid #28a745;
        }

        .summary-card.filtered {
          border-left: 4px solid #007bff;
        }

        .summary-card.count {
          border-left: 4px solid #ffc107;
        }

        .summary-card h3 {
          margin: 0 0 15px 0;
          color: #666;
          font-size: 14px;
          text-transform: uppercase;
        }

        .summary-card .amount {
          margin: 0 0 10px 0;
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }

        .summary-card .count {
          margin: 0 0 10px 0;
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }

        .summary-card .period {
          color: #999;
          font-size: 12px;
        }

        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-group label {
          color: #666;
          font-weight: 500;
        }

        .filter-group select {
          padding: 8px 12px;
          border: 2px solid #dee2e6;
          border-radius: 5px;
          background: white;
          cursor: pointer;
        }

        .export-button {
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .export-button:hover {
          background: #218838;
        }

        .payments-table {
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

        .amount {
          font-weight: 600;
          color: #28a745;
        }

        .date {
          color: #666;
        }

        .type {
          color: #495057;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.completed {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.failed {
          background: #f8d7da;
          color: #721c24;
        }

        .no-payments {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        @media (max-width: 768px) {
          .revenue-reports-container {
            padding: 10px;
          }

          .summary-cards {
            grid-template-columns: 1fr;
          }

          .controls {
            flex-direction: column;
            align-items: stretch;
          }

          .payments-table {
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

export default RevenueReports;
