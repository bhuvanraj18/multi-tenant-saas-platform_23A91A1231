const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const {
    findTenantBySubdomain,
    createTenant,
    createUser,
    findUserByEmailAndTenant,
    findUserById,
    logAudit
} = require('../models');

/* =========================
   REGISTER TENANT
========================= */
const registerTenant = async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const existingTenant = await findTenantBySubdomain(subdomain);
        if (existingTenant) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Subdomain already exists' });
        }

        const newTenant = await createTenant(client, { name: tenantName, subdomain });

        const passwordHash = await bcrypt.hash(adminPassword, 10);

        const newAdmin = await createUser(client, {
            tenantId: newTenant.id,
            email: adminEmail,
            passwordHash,
            fullName: adminFullName,
            role: 'tenant_admin'
        });

        await logAudit(client, {
            tenantId: newTenant.id,
            userId: newAdmin.id,
            action: 'REGISTER_TENANT',
            entityType: 'tenant',
            entityId: newTenant.id
        });

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Tenant registered successfully',
            data: {
                tenantId: newTenant.id,
                subdomain: newTenant.subdomain,
                adminUser: {
                    id: newAdmin.id,
                    email: newAdmin.email,
                    fullName: newAdmin.full_name,
                    role: newAdmin.role
                }
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    } finally {
        client.release();
    }
};

/* =========================
   LOGIN (FINAL FIXED VERSION)
========================= */
const login = async (req, res) => {
    console.log('LOGIN HIT:', req.body);

    const { email, password, tenantSubdomain } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    try {
        let tenant = null;
        let user = null;

        // 🔹 SUPER ADMIN LOGIN (NO TENANT)
        if (!tenantSubdomain) {
            user = await findUserByEmailAndTenant(email, null);

            if (!user || user.role !== 'super_admin') {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        }
        // 🔹 TENANT USER LOGIN
        else {
            tenant = await findTenantBySubdomain(tenantSubdomain);
            if (!tenant) {
                return res.status(404).json({ success: false, message: 'Tenant not found' });
            }

            if (tenant.status !== 'active') {
                return res.status(403).json({ success: false, message: 'Tenant is inactive' });
            }

            user = await findUserByEmailAndTenant(email, tenant.id);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log('PASSWORD MATCH:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account is inactive' });
        }

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    tenantId: user.tenant_id
                },
                token,
                expiresIn: 86400
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/* =========================
   GET CURRENT USER
========================= */
const getMe = async (req, res) => {
    try {
        const user = await findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                isActive: user.is_active,
                tenant: user.tenant_id ? {
                    id: user.tenant_id,
                    name: user.tenant_name,
                    subdomain: user.subdomain
                } : null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    registerTenant,
    login,
    getMe
};
