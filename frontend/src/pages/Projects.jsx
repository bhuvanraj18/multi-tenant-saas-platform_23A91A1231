import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchProjects = async () => {
        try {
            const res = await projectAPI.list({ search });
            if (res.data.success) {
                setProjects(res.data.data.projects);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [search]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Projects</h1>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Project
                </button>
            </div>

            <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                    type="text" 
                    className="input-field" 
                    style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {projects.map(project => (
                        <Link key={project.id} to={`/projects/${project.id}`} className="card" style={{ display: 'block', transition: 'transform 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{project.name}</h3>
                                <span className={`badge badge-${project.status}`}>{project.status}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', height: '3rem', overflow: 'hidden' }}>
                                {project.description || 'No description provided.'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <span>{project.taskCount} tasks</span>
                                <span style={{ color: 'var(--text-secondary)' }}>Created by {project.createdBy.fullName}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} onCreated={fetchProjects} />}
        </div>
    );
};

const CreateProjectModal = ({ onClose, onCreated }) => {
    const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await projectAPI.create(formData);
            onCreated();
            onClose();
        } catch (error) {
            alert('Failed to create project');
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create New Project</h2>
                <form onSubmit={handleSubmit}>
                    <input className="input-field" placeholder="Project Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <textarea className="input-field" placeholder="Description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Projects;
