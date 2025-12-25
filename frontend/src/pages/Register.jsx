import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.adminPassword !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const res = await authAPI.registerTenant({
          tenantName: formData.tenantName,
          subdomain: formData.subdomain,
          adminFullName: formData.adminFullName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword
      });
      
      if (res.data.success) {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Register Organization</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Get started with your free trial</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#991b1b', 
            padding: '0.75rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '1rem',
            fontSize: '0.875rem' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Organization Name
            </label>
            <input
              type="text"
              name="tenantName"
              className="input-field"
              value={formData.tenantName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
             <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
               Subdomain
             </label>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="subdomain"
                  className="input-field"
                  style={{ marginBottom: '1rem', flex: 1 }}
                  placeholder="company"
                  value={formData.subdomain}
                  onChange={handleChange}
                  required
                />
                <span style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>.saas-app.com</span>
             </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Admin Full Name
            </label>
            <input
              type="text"
              name="adminFullName"
              className="input-field"
              value={formData.adminFullName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Admin Email
            </label>
            <input
              type="email"
              name="adminEmail"
              className="input-field"
              value={formData.adminEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Password
                </label>
                <input
                type="password"
                name="adminPassword"
                className="input-field"
                value={formData.adminPassword}
                onChange={handleChange}
                required
                minLength={8}
                />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Confirm Password
                </label>
                <input
                type="password"
                name="confirmPassword"
                className="input-field"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : (
                <>
                    <Building2 size={18} style={{ marginRight: '0.5rem' }} /> Register
                </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '500' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
