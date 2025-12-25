const bcrypt = require('bcrypt');
const db = require('../config/db');
const {
    createUser,
    findAllUsersByTenant,
    countUsersByTenant,
    findUserById,
    updateUser,
    deleteUser,
    logAudit,
    findTenantById
} = require('../models');

const addUser = async (req, res) => {
    const { tenantId } = req.params;
    const { email, password, fullName, role } = req.body;
    const { user: currentUser } = req;

    // Authorization
    if (currentUser.role !== 'tenant_admin' || currentUser.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Check limits
        const tenant = await findTenantById(tenantId);
        const currentCount = await countUsersByTenant(tenantId);
        if (currentCount >= tenant.max_users) {
            return res.status(403).json({ success: false, message: 'Subscription user limit reached' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await createUser(db, {
            tenantId,
            email,
            passwordHash,
            fullName,
            role: role || 'user'
        });

        await logAudit(db, {
            tenantId,
            userId: currentUser.userId,
            action: 'CREATE_USER',
            entityType: 'user',
            entityId: newUser.id
        });

        // Don't return password hash
        delete newUser.password_hash;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const listUsers = async (req, res) => {
    const { tenantId } = req.params;
    const { user: currentUser } = req;

    if (currentUser.tenantId !== tenantId && currentUser.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    try {
        const users = await findAllUsersByTenant(tenantId, limit, offset);
        const total = await countUsersByTenant(tenantId);

        res.json({
            success: true,
            data: {
                users,
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

const updateUserDetails = async (req, res) => {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;
    const { user: currentUser } = req;

    try {
        const targetUser = await findUserById(userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Authorization logic
        const isSelf = currentUser.userId === userId;
        const isAdmin = currentUser.role === 'tenant_admin' && currentUser.tenantId === targetUser.tenant_id;

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const updates = {};
        if (fullName) updates.full_name = fullName;

        // Only admin can update role/active
        if (isAdmin) {
            if (role) updates.role = role;
            if (isActive !== undefined) updates.is_active = isActive;
        }

        const updatedUser = await updateUser(userId, updates);

        await logAudit(db, {
            tenantId: targetUser.tenant_id,
            userId: currentUser.userId,
            action: 'UPDATE_USER',
            entityType: 'user',
            entityId: userId
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const removeUser = async (req, res) => {
    const { userId } = req.params;
    const { user: currentUser } = req;

    try {
        const targetUser = await findUserById(userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (currentUser.role !== 'tenant_admin' || currentUser.tenantId !== targetUser.tenant_id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (currentUser.userId === userId) {
            return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
        }

        await deleteUser(db, userId);

        await logAudit(db, {
            tenantId: targetUser.tenant_id,
            userId: currentUser.userId,
            action: 'DELETE_USER',
            entityType: 'user',
            entityId: userId
        });

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    addUser,
    listUsers,
    updateUserDetails,
    removeUser
};
