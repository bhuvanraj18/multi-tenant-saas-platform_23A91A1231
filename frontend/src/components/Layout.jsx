import { Briefcase, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <nav style={{ 
                backgroundColor: 'var(--surface-color)', 
                borderBottom: '1px solid var(--border-color)', 
                padding: '0.75rem 0',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <Link to="/dashboard" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            SaaS Platform
                        </Link>
                        
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <NavLink to="/dashboard" icon={<LayoutDashboard size={18}/>} label="Dashboard" active={location.pathname === '/dashboard'} />
                            <NavLink to="/projects" icon={<Briefcase size={18}/>} label="Projects" active={location.pathname.startsWith('/projects')} />
                            {/* Only show Users for Tenant Admin */}
                            {(user?.role === 'tenant_admin' || user?.role === 'super_admin') && (
                                <NavLink to="/users" icon={<Users size={18}/>} label="Users" active={location.pathname.startsWith('/users')} />
                            )}
                            {/* Super Admin specific */}
                            {user?.role === 'super_admin' && (
                                <NavLink to="/tenants" icon={<Building2 size={18}/>} label="Tenants" active={location.pathname.startsWith('/tenants')} />
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                            <div style={{ fontWeight: '600' }}>{user?.fullName}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                {user?.role?.replace('_', ' ')} • {user?.tenant?.name}
                            </div>
                        </div>
                        <button 
                            onClick={logout}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem' }}
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ flex: 1, padding: '2rem 0' }}>
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const NavLink = ({ to, icon, label, active }) => (
    <Link 
        to={to} 
        style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: active ? '600' : '500',
            fontSize: '0.875rem'
        }}
    >
        {icon} {label}
    </Link>
);

// Helper for icon import if needed, but imported at top
import { Building2 } from 'lucide-react';

export default Layout;
