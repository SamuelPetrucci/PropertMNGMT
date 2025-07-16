import React, { useState } from 'react';
import './Auth.css';

// Function to get the API base URL dynamically
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000';
  } else {
    // For IP access, use the same hostname but port 5000
    return `http://${hostname}:5000`;
  }
};

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (username, password) => {
    setFormData({
      username,
      password,
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Stylish Branded Title */}
        <h1 className="nif-logo-title">
          <span className="nif-logo-main">NIF</span> <span className="nif-logo-sub">Properties</span>
        </h1>
        {/* End Stylish Branded Title */}
        {/* {error && <div className="error-message">{error}</div>} */}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-accounts">
          <h4>Demo Accounts:</h4>
          
          <div className="demo-section">
            <h5>🏠 Property Owners (Landlords):</h5>
            <div className="demo-account">
              <strong>Alice Johnson:</strong> alice_landlord / password123
              <button 
                className="quick-login-btn" 
                onClick={() => handleQuickLogin('alice_landlord', 'password123')}
              >
                Quick Login
              </button>
            </div>
            <div className="demo-account">
              <strong>Bob Smith:</strong> bob_landlord / password123
              <button 
                className="quick-login-btn" 
                onClick={() => handleQuickLogin('bob_landlord', 'password123')}
              >
                Quick Login
              </button>
            </div>
            <div className="demo-account">
              <strong>Carol Williams:</strong> carol_landlord / password123
              <button 
                className="quick-login-btn" 
                onClick={() => handleQuickLogin('carol_landlord', 'password123')}
              >
                Quick Login
              </button>
            </div>
            <div className="demo-account">
              <strong>David Brown:</strong> david_landlord / password123
              <button 
                className="quick-login-btn" 
                onClick={() => handleQuickLogin('david_landlord', 'password123')}
              >
                Quick Login
              </button>
            </div>
          </div>

          <div className="demo-section">
            <h5>👥 Tenants:</h5>
            <div className="demo-account">
              <strong>John Doe:</strong> john_doe / tenant123
              <button 
                className="quick-login-btn" 
                onClick={() => handleQuickLogin('john_doe', 'tenant123')}
              >
                Quick Login
              </button>
            </div>
            <div className="demo-account">
              <strong>Jane Smith:</strong> jane_smith / tenant123
              <button 
                className="quick-login-btn" 
                onClick={() => handleQuickLogin('jane_smith', 'tenant123')}
              >
                Quick Login
              </button>
            </div>
            <div className="demo-account">
              <strong>Mike Wilson:</strong> mike_wilson / tenant123
            </div>
            <div className="demo-account">
              <strong>Sarah Jones:</strong> sarah_jones / tenant123
            </div>
            <div className="demo-account">
              <strong>Tom Brown:</strong> tom_brown / tenant123
            </div>
            <div className="demo-account">
              <strong>Lisa Davis:</strong> lisa_davis / tenant123
            </div>
            <div className="demo-account">
              <strong>James Miller:</strong> james_miller / tenant123
            </div>
            <div className="demo-account">
              <strong>Emily Garcia:</strong> emily_garcia / tenant123
            </div>
            <div className="demo-account">
              <strong>Robert Rodriguez:</strong> robert_rodriguez / tenant123
            </div>
            <div className="demo-account">
              <strong>Jennifer Martinez:</strong> jennifer_martinez / tenant123
            </div>
            <div className="demo-account">
              <strong>Michael Anderson:</strong> michael_anderson / tenant123
            </div>
            <div className="demo-account">
              <strong>Amanda Taylor:</strong> amanda_taylor / tenant123
            </div>
          </div>

          <div className="demo-section">
            <h5>🔧 Contractors:</h5>
            <div className="demo-account">
              <strong>Mike Contractor:</strong> mike_contractor / contractor123
              <button 
                className="quick-login-btn" 
                onClick={() => handleQuickLogin('mike_contractor', 'contractor123')}
              >
                Quick Login
              </button>
            </div>
            <div className="demo-account">
              <strong>Joe Plumber:</strong> joe_plumber / contractor123
            </div>
            <div className="demo-account">
              <strong>Sam Electrician:</strong> sam_electrician / contractor123
            </div>
            <div className="demo-account">
              <strong>Tony Handyman:</strong> tony_handyman / contractor123
            </div>
          </div>

          <div className="demo-tip">
            <strong>💡 Tip:</strong> Try logging in as different landlords to see their unique property portfolios!
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 