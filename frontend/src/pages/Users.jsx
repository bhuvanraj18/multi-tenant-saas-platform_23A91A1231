import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await userAPI.list(user.tenantId);
            if (res.data.success) {
                setUsers(res.data.data.users);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.role === 'tenant_admin' || user.role === 'super_admin') {
            fetchUsers();
        }
    }, [user]);

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to remove this user?')) {
            await userAPI.delete(userId);
            fetchUsers();
        }
    };

    if (user.role !== 'tenant_admin' && user.role !== 'super_admin') {
        return <div>Access Denied. Admins only.</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Team Members</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add User
                </button>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '1rem 0' }}>Name</th>
                            <th style={{ padding: '1rem 0' }}>Email</th>
                            <th style={{ padding: '1rem 0' }}>Role</th>
                            <th style={{ padding: '1rem 0' }}>Status</th>
                            <th style={{ padding: '1rem 0', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem 0', fontWeight: '500' }}>{u.full_name}</td>
                                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{u.email}</td>
                                <td style={{ padding: '1rem 0' }}>
                                    <span className="badge" style={{ backgroundColor: '#f1f5f9' }}>{u.role.replace('_', ' ')}</span>
                                </td>
                                <td style={{ padding: '1rem 0' }}>
                                    <span className={`badge ${u.is_active ? 'badge-active' : 'badge-low'}`}>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                                    {u.id !== user.userId && (
                                        <button className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--error-color)' }} onClick={() => handleDelete(u.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && <AddUserModal tenantId={user.tenantId} onClose={() => setShowModal(false)} onCreated={fetchUsers} />}
        </div>
    );
};

const AddUserModal = ({ tenantId, onClose, onCreated }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'user' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await userAPI.create(tenantId, formData);
            onCreated();
            onClose();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add New Team Member</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input className="input-field" placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                    <input className="input-field" type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    <input className="input-field" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={8} />
                    
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
                    <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        <option value="user">User</option>
                        <option value="tenant_admin">Admin</option>
                    </select>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>Add Member</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Users;
