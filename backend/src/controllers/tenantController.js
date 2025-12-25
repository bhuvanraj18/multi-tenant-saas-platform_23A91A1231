const db = require('../config/db');
const {
    findTenantById,
    findAllTenants,
    countTenants,
    updateTenant,
    logAudit
} = require('../models');

const getTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { user } = req;

    // Authorization: User must belong to this tenant or be super_admin
    if (user.role !== 'super_admin' && user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to tenant data' });
    }

    try {
        const tenant = await findTenantById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        // Calculate stats (Mocked for now or added via another query if needed, instructions said "calculate stats")
        // Implementation: "stats": { "totalUsers": 5, ... }
        // For simplicity/performance, let's just return basic info or do separate counts
        // Detailed stats might be expensive. Let's do a simple count query if required.
        const userCountRes = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const projectCountRes = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);

        const tenantData = {
            ...tenant,
            stats: {
                totalUsers: parseInt(userCountRes.rows[0].count),
                totalProjects: parseInt(projectCountRes.rows[0].count),
                // totalTasks: ...
            }
        };

        res.json({ success: true, data: tenantData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getAllTenants = async (req, res) => {
    const { user } = req;
    if (user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Management access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const tenants = await findAllTenants(limit, offset);
        const total = await countTenants();

        res.json({
            success: true,
            data: {
                tenants,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalTenants: total,
                    limit
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateTenantDetails = async (req, res) => {
    const { tenantId } = req.params;
    const { name } = req.body;
    const { user } = req;

    // Authorization: tenant_admin or super_admin
    if (user.role !== 'super_admin' && user.role !== 'tenant_admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // specific check: tenant_admin can only update their own tenant
    if (user.role === 'tenant_admin' && user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const updatedTenant = await updateTenant(tenantId, { name });

        await logAudit(db, {
            tenantId,
            userId: user.userId,
            action: 'UPDATE_TENANT',
            entityType: 'tenant',
            entityId: tenantId
        });

        res.json({
            success: true,
            message: 'Tenant updated successfully',
            data: updatedTenant
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getTenant,
    getAllTenants,
    updateTenantDetails
};
