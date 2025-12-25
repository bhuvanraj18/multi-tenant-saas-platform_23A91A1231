import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI, taskAPI, userAPI } from '../services/api';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]); // For assignment dropdown
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            const [projRes, tasksRes, usersRes] = await Promise.all([
                projectAPI.getById(id),
                taskAPI.list(id, { limit: 100 }), // Get all tasks for now
                userAPI.list(user.tenantId, { limit: 100 }) // Get available users
            ]);

            if (projRes.data.success) {
                setProject(projRes.data.data);
            }
            if (tasksRes.data.success) {
                setTasks(tasksRes.data.data.tasks);
            }
            if (usersRes?.data?.success) {
                setUsers(usersRes.data.data.users);
            }
        } catch (error) {
            console.error(error);
            // Handle 404
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            await projectAPI.delete(id);
            navigate('/projects');
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            await taskAPI.updateStatus(taskId, newStatus);
            fetchProjectData(); // Refresh
        } catch (error) {
            console.error('Failed to update status');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

    const filteredTasks = statusFilter ? tasks.filter(t => t.status === statusFilter) : tasks;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {project.name} 
                        <span className={`badge badge-${project.status}`}>{project.status}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{project.description}</p>
                </div>
                {(user.role === 'tenant_admin' || user.userId === project.createdBy.id) && (
                    <button className="btn btn-secondary" style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={handleDeleteProject}>
                        <Trash2 size={16} style={{ marginRight: '0.5rem' }} /> Delete Project
                    </button>
                )}
            </div>

            {/* Tasks Section */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Tasks</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <select className="input-field" style={{ marginBottom: 0, width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Task
                        </button>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '1rem 0', fontWeight: '500' }}>Title</th>
                            <th style={{ padding: '1rem 0', fontWeight: '500' }}>Assigned To</th>
                            <th style={{ padding: '1rem 0', fontWeight: '500' }}>Priority</th>
                            <th style={{ padding: '1rem 0', fontWeight: '500' }}>Status</th>
                            <th style={{ padding: '1rem 0', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.map(task => (
                            <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem 0' }}>{task.title}</td>
                                <td style={{ padding: '1rem 0' }}>
                                    {task.assignedTo ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                                {task.assignedTo.fullName.charAt(0)}
                                            </div>
                                            {task.assignedTo.fullName}
                                        </div>
                                    ) : <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>}
                                </td>
                                <td style={{ padding: '1rem 0' }}><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                                <td style={{ padding: '1rem 0' }}>
                                    <select 
                                        value={task.status} 
                                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </td>
                                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                                    {/* Edit Task could be modal, skip for brevity */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showTaskModal && (
                <CreateTaskModal 
                    projectId={id} 
                    users={users} 
                    onClose={() => setShowTaskModal(false)} 
                    onCreated={fetchProjectData} 
                />
            )}
        </div>
    );
};

const CreateTaskModal = ({ projectId, users, onClose, onCreated }) => {
    const [formData, setFormData] = useState({ title: '', assignedTo: '', priority: 'medium', dueDate: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await taskAPI.create(projectId, {
                ...formData,
                assignedTo: formData.assignedTo || null
            });
            onCreated();
            onClose();
        } catch (error) {
            alert('Failed to create task');
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add New Task</h2>
                <form onSubmit={handleSubmit}>
                    <input className="input-field" placeholder="Task Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                    
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Assign To</label>
                    <select className="input-field" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                        <option value="">Unassigned</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Priority</label>
                            <select className="input-field" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Due Date</label>
                            <input type="date" className="input-field" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>Create Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectDetails;
