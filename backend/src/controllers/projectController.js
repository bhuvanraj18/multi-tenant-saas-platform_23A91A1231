const db = require('../config/db');
const {
    createProject,
    findAllProjectsByTenant,
    countProjectsByTenant,
    findProjectById,
    updateProject,
    deleteProject,
    findTenantById,
    logAudit
} = require('../models');

const createNewProject = async (req, res) => {
    const { name, description, status } = req.body;
    const { user } = req;

    if (!name) return res.status(400).json({ success: false, message: 'Project name is required' });

    try {
        // Check limits
        const tenant = await findTenantById(user.tenantId);
        const currentCount = await countProjectsByTenant(user.tenantId);

        if (currentCount >= tenant.max_projects) {
            return res.status(403).json({ success: false, message: 'Subscription project limit reached' });
        }

        const newProject = await createProject(db, {
            tenantId: user.tenantId,
            name,
            description,
            status,
            createdBy: user.userId
        });

        await logAudit(db, {
            tenantId: user.tenantId,
            userId: user.userId,
            action: 'CREATE_PROJECT',
            entityType: 'project',
            entityId: newProject.id
        });

        res.status(201).json({
            success: true,
            data: newProject
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const listProjects = async (req, res) => {
    const { user } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    try {
        const projects = await findAllProjectsByTenant(user.tenantId, limit, offset, search, status);
        const total = await countProjectsByTenant(user.tenantId, search, status);

        // Format data to match requirement (nested createdBy object)
        const formattedProjects = projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            createdBy: {
                id: p.created_by,
                fullName: p.creator_name
            },
            taskCount: parseInt(p.task_count),
            completedTaskCount: parseInt(p.completed_task_count),
            createdAt: p.created_at
        }));

        res.json({
            success: true,
            data: {
                projects: formattedProjects,
                total,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    limit
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const singleProject = async (req, res) => {
    const { projectId } = req.params;
    const { user } = req;

    try {
        const project = await findProjectById(projectId);

        if (!project || project.tenant_id !== user.tenantId) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.json({
            success: true,
            data: {
                ...project,
                createdBy: { id: project.created_by, fullName: project.creator_name }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateProjectDetails = async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { user } = req;

    try {
        const project = await findProjectById(projectId);

        if (!project || project.tenant_id !== user.tenantId) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Auth: tenant_admin or creator
        if (user.role !== 'tenant_admin' && user.userId !== project.created_by) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const updates = {};
        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (status) updates.status = status;

        const updatedProject = await updateProject(projectId, updates);

        await logAudit(db, {
            tenantId: user.tenantId,
            userId: user.userId,
            action: 'UPDATE_PROJECT',
            entityType: 'project',
            entityId: projectId
        });

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: updatedProject
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const removeProject = async (req, res) => {
    const { projectId } = req.params;
    const { user } = req;

    try {
        const project = await findProjectById(projectId);

        if (!project || project.tenant_id !== user.tenantId) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (user.role !== 'tenant_admin' && user.userId !== project.created_by) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await deleteProject(projectId);

        await logAudit(db, {
            tenantId: user.tenantId,
            userId: user.userId,
            action: 'DELETE_PROJECT',
            entityType: 'project',
            entityId: projectId
        });

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error);

        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createNewProject,
    listProjects,
    singleProject,
    updateProjectDetails,
    removeProject
};
