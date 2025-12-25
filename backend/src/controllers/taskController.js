const db = require('../config/db');
const {
    createTask,
    findProjectById,
    findAllTasksByProject,
    countTasksByProject,
    findTaskById,
    updateTask,
    deleteTask,
    findUserById,
    logAudit
} = require('../models');

const addTask = async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const { user } = req;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    try {
        // Verify project
        const project = await findProjectById(projectId);
        if (!project || project.tenant_id !== user.tenantId) {
            return res.status(403).json({ success: false, message: 'Project access denied' });
        }

        // Verify assignee if provided
        if (assignedTo) {
            const assignee = await findUserById(assignedTo);
            if (!assignee || assignee.tenant_id !== user.tenantId) {
                return res.status(400).json({ success: false, message: 'Assignee not found in this tenant' });
            }
        }

        const newTask = await createTask(db, {
            projectId,
            tenantId: project.tenant_id, // Use project's tenant_id
            title,
            description,
            priority,
            assignedTo,
            dueDate
        });

        await logAudit(db, {
            tenantId: user.tenantId,
            userId: user.userId,
            action: 'CREATE_TASK',
            entityType: 'task',
            entityId: newTask.id
        });

        res.status(201).json({
            success: true,
            data: newTask
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const listTasks = async (req, res) => {
    const { projectId } = req.params;
    const { user } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    try {
        const project = await findProjectById(projectId);
        if (!project || project.tenant_id !== user.tenantId) {
            return res.status(403).json({ success: false, message: 'Project access denied' });
        }

        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            assignedTo: req.query.assignedTo,
            search: req.query.search
        };

        const tasks = await findAllTasksByProject(projectId, limit, offset, filters);
        const total = await countTasksByProject(projectId, filters);

        const formattedTasks = tasks.map(t => ({
            ...t,
            assignedTo: t.assigned_to ? {
                id: t.assigned_to,
                fullName: t.assignee_name,
                email: t.assignee_email
            } : null
        }));

        res.json({
            success: true,
            data: {
                tasks: formattedTasks,
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

const updateTaskDetails = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { user } = req;

    try {
        const task = await findTaskById(taskId);
        if (!task || task.tenant_id !== user.tenantId) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (assignedTo) {
            const assignee = await findUserById(assignedTo);
            if (!assignee || assignee.tenant_id !== user.tenantId) {
                return res.status(400).json({ success: false, message: 'Assignee not found in this tenant' });
            }
        }

        const updates = {};
        if (title) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (assignedTo !== undefined) updates.assigned_to = assignedTo; // can be null
        if (dueDate !== undefined) updates.due_date = dueDate; // can be null

        const updatedTask = await updateTask(taskId, updates);

        // Re-fetch to get assignee details for response if needed, OR just return updated fields + ID
        // The req says return: { ..., assignedTo: { ... } }
        // Let's do a quick findTaskById again to get full joined data
        const fullUpdatedTask = await findTaskById(taskId);

        await logAudit(db, {
            tenantId: user.tenantId,
            userId: user.userId,
            action: 'UPDATE_TASK',
            entityType: 'task',
            entityId: taskId
        });

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: {
                ...fullUpdatedTask,
                assignedTo: fullUpdatedTask.assigned_to ? {
                    id: fullUpdatedTask.assigned_to,
                    fullName: fullUpdatedTask.assignee_name,
                    email: fullUpdatedTask.assignee_email
                } : null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;
    const { user } = req;

    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    try {
        const task = await findTaskById(taskId);
        if (!task || task.tenant_id !== user.tenantId) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await updateTask(taskId, { status });

        res.json({
            success: true,
            data: {
                id: taskId,
                status,
                updatedAt: new Date().toISOString() // Approximate
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const removeTask = async (req, res) => {
    const { taskId } = req.params;
    const { user } = req;

    try {
        const task = await findTaskById(taskId);
        if (!task || task.tenant_id !== user.tenantId) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Project/Tenant admin or Creator check? Spec says: "Authorization: tenant_admin OR project creator" for project.
        // For task: "Verify task belongs to user's tenant". No specific role restriction for DELETING task mentioned in spec explicitly under API 19 Update, 
        // wait, API 19 is Update. DELETE is not explicitly listed as a separate API endpoint in the list 16-19...?
        // Ah, "API 15: Delete Project". "API 11: Delete User".
        // Wait, where is "Delete Task"? 
        // In "Frontend... Step 4.3... DELETE /api/tasks/:id". 
        // So I should implement DELETE /api/tasks/:id.

        await deleteTask(taskId);

        await logAudit(db, {
            tenantId: user.tenantId,
            userId: user.userId,
            action: 'DELETE_TASK',
            entityType: 'task',
            entityId: taskId
        });

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    addTask,
    listTasks,
    updateTaskDetails,
    updateTaskStatus,
    removeTask
};
