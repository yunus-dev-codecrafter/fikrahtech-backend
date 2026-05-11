// Login.jsx - Frontend Component with JWT Token Handling
// Place this in your frontend project (Vercel)

import React, { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // JWT Token validation helper
  const isValidJWT = (token) => {
    if (!token) return false;
    const parts = token.split('.');
    return parts.length === 3;
  };

  // API call helper with token validation
  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    // Only add Authorization header if token is valid
    if (token && isValidJWT(token)) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    } else if (token) {
      console.warn('Invalid JWT token format, removing from storage');
      localStorage.removeItem('token');
    }

    return fetch(url, options);
  };

  const handleLogin = async (e) => {
    // CRITICAL: Prevent page refresh
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://fikrahtech-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      // Debug: Log API response
      console.log('API Response:', data);

      if (response.ok) {
        // Store token exactly as it comes from the API
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('Token stored:', data.token);
        }
        
        // Store user info
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError(data.message || data.error || 'Login failed');
      }
    } catch (err) {
      // Debug: Log detailed error
      console.error('Login Error details:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Super Admin Login</h2>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@fikrahtech.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .login-form {
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }

        h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: #333;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
          font-weight: 500;
        }

        input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        input:focus {
          outline: none;
          border-color: #667eea;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 0.75rem;
          border-radius: 5px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .login-button {
          width: 100%;
          padding: 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s;
        }

        .login-button:hover:not(:disabled) {
          background: #5a6fd8;
        }

        .login-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Login;
