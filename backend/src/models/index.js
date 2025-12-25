const db = require('../config/db');

// Tenant Models
const findTenantBySubdomain = async (subdomain) => {
    const res = await db.query('SELECT * FROM tenants WHERE subdomain = $1', [subdomain]);
    return res.rows[0];
};

const findTenantById = async (id) => {
    const res = await db.query('SELECT * FROM tenants WHERE id = $1', [id]);
    return res.rows[0];
};

const createTenant = async (client, { name, subdomain, subscriptionPlan = 'free', maxUsers = 5, maxProjects = 3 }) => {
    const res = await client.query(
        'INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, subdomain, 'active', subscriptionPlan, maxUsers, maxProjects]
    );
    return res.rows[0];
};

// User Models
const findUserByEmailAndTenant = async (email, tenantId) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
    return res.rows[0];
};

const findUserById = async (id) => {
    const res = await db.query(
        `SELECT u.*, t.subdomain, t.name as tenant_name 
         FROM users u 
         LEFT JOIN tenants t ON u.tenant_id = t.id 
         WHERE u.id = $1`, [id]);
    return res.rows[0];
};

const createUser = async (client, { tenantId, email, passwordHash, fullName, role = 'user' }) => {
    const res = await client.query(
        'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [tenantId, email, passwordHash, fullName, role]
    );
    return res.rows[0];
};

const logAudit = async (client, { tenantId, userId, action, entityType, entityId }) => {
    // client can be pool or transaction client
    const queryRunner = client || db;
    await queryRunner.query(
        'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
        [tenantId, userId, action, entityType, entityId]
    );
};

const findAllTenants = async (limit, offset) => {
    const res = await db.query('SELECT * FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    return res.rows;
};

const countTenants = async () => {
    const res = await db.query('SELECT COUNT(*) FROM tenants');
    return parseInt(res.rows[0].count);
};

const updateTenant = async (id, { name }) => {
    const res = await db.query(
        'UPDATE tenants SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [name, id]
    );
    return res.rows[0];
};

const findAllUsersByTenant = async (tenantId, limit, offset) => {
    const res = await db.query(
        `SELECT id, email, full_name, role, is_active, created_at 
         FROM users WHERE tenant_id = $1 
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset]
    );
    return res.rows;
};

const countUsersByTenant = async (tenantId) => {
    const res = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    return parseInt(res.rows[0].count);
};

const updateUser = async (id, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
    }
    values.push(id);

    const res = await db.query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id, full_name, role, is_active, updated_at`,
        values
    );
    return res.rows[0];
};

const deleteUser = async (client, id) => {
    const queryRunner = client || db;
    // Assuming CASCADE triggers handle cleanup or we explicitly delete
    // The requirement says: "Cascade delete related data OR set assigned_to to NULL in tasks"
    // Our schema for users->tasks assigned_to does NOT have CASCADE (it shouldn't generally if we want to keep history? or maybe it sets NULL? Migration says REFERENCES users(id))
    // Actually migration says: assigned_to UUID REFERENCES users(id). Default behavior is NO ACTION/RESTRICT.
    // So we should manually set tasks to NULL.
    await queryRunner.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [id]);
    const res = await queryRunner.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
};

const createProject = async (client, { tenantId, name, description, status, createdBy }) => {
    const res = await client.query(
        'INSERT INTO projects (tenant_id, name, description, status, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [tenantId, name, description, status || 'active', createdBy]
    );
    return res.rows[0];
};

const findProjectById = async (id) => {
    const res = await db.query(`
        SELECT p.*, u.full_name as creator_name 
        FROM projects p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = $1`, [id]);
    return res.rows[0];
};

const findAllProjectsByTenant = async (tenantId, limit, offset, search, status) => {
    let query = `
        SELECT p.*, 
               (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
               (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count,
               u.full_name as creator_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.tenant_id = $1
    `;
    const params = [tenantId];
    let idx = 2;

    if (status) {
        query += ` AND p.status = $${idx}`;
        params.push(status);
        idx++;
    }

    if (search) {
        query += ` AND p.name ILIKE $${idx}`;
        params.push(`%${search}%`);
        idx++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const res = await db.query(query, params);
    return res.rows;
};

const countProjectsByTenant = async (tenantId, search, status) => {
    let query = 'SELECT COUNT(*) FROM projects WHERE tenant_id = $1';
    const params = [tenantId];
    let idx = 2;
    if (status) {
        query += ` AND status = $${idx}`;
        params.push(status);
        idx++;
    }
    if (search) {
        query += ` AND name ILIKE $${idx}`;
        params.push(`%${search}%`);
        idx++;
    }
    const res = await db.query(query, params);
    return parseInt(res.rows[0].count);
};

const updateProject = async (id, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
    }
    values.push(id);

    const res = await db.query(
        `UPDATE projects SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`,
        values
    );
    return res.rows[0];
};

const deleteProject = async (id) => {
    // Tasks are CASCADE deleted by FK, but good to be explicit if needed. 
    // Schema has ON DELETE CASCADE for tasks -> project_id. So just deleting project is enough.
    const res = await db.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
};

const createTask = async (client, { projectId, tenantId, title, description, status, priority, assignedTo, dueDate }) => {
    const res = await client.query(
        'INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [projectId, tenantId, title, description, status || 'todo', priority || 'medium', assignedTo, dueDate]
    );
    return res.rows[0];
};

const findTaskById = async (id) => {
    const res = await db.query(`
        SELECT t.*, u.full_name as assignee_name, u.email as assignee_email
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = $1`, [id]);
    return res.rows[0];
};

const findAllTasksByProject = async (projectId, limit, offset, filters) => {
    let query = `
        SELECT t.*, u.full_name as assignee_name, u.email as assignee_email
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = $1
    `;
    const params = [projectId];
    let idx = 2;

    if (filters.status) { query += ` AND t.status = $${idx}`; params.push(filters.status); idx++; }
    if (filters.priority) { query += ` AND t.priority = $${idx}`; params.push(filters.priority); idx++; }
    if (filters.assignedTo) { query += ` AND t.assigned_to = $${idx}`; params.push(filters.assignedTo); idx++; }
    if (filters.search) { query += ` AND t.title ILIKE $${idx}`; params.push(`%${filters.search}%`); idx++; }

    // Order by priority (high > medium > low) then due date
    query += ` ORDER BY 
        CASE 
            WHEN t.priority = 'high' THEN 1 
            WHEN t.priority = 'medium' THEN 2 
            WHEN t.priority = 'low' THEN 3 
            ELSE 4 END ASC,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const res = await db.query(query, params);
    return res.rows;
};

const countTasksByProject = async (projectId, filters) => {
    let query = 'SELECT COUNT(*) FROM tasks t WHERE t.project_id = $1';
    const params = [projectId];
    let idx = 2;
    if (filters.status) { query += ` AND t.status = $${idx}`; params.push(filters.status); idx++; }
    if (filters.priority) { query += ` AND t.priority = $${idx}`; params.push(filters.priority); idx++; }
    if (filters.assignedTo) { query += ` AND t.assigned_to = $${idx}`; params.push(filters.assignedTo); idx++; }
    if (filters.search) { query += ` AND t.title ILIKE $${idx}`; params.push(`%${filters.search}%`); idx++; }

    const res = await db.query(query, params);
    return parseInt(res.rows[0].count);
};

const updateTask = async (id, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
    }
    values.push(id);

    const res = await db.query(
        `UPDATE tasks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`,
        values
    );
    return res.rows[0];
};

const deleteTask = async (id) => {
    const res = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
};

module.exports = {
    findTenantBySubdomain,
    findTenantById,
    findAllTenants,
    countTenants,
    createTenant,
    updateTenant,
    findUserByEmailAndTenant,
    findUserById,
    findAllUsersByTenant,
    countUsersByTenant,
    createUser,
    updateUser,
    deleteUser,
    createProject,
    findProjectById,
    findAllProjectsByTenant,
    countProjectsByTenant,
    updateProject,
    deleteProject,
    createTask,
    findTaskById,
    findAllTasksByProject,
    countTasksByProject,
    updateTask,
    deleteTask,
    logAudit
};
