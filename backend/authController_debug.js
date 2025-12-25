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

const registerTenant = async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // Validation (Basic, should use Joi in production)
    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Check if subdomain exists
        const existingTenant = await findTenantBySubdomain(subdomain);
        if (existingTenant) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Subdomain already exists' });
        }

        // Create Tenant
        const newTenant = await createTenant(client, { name: tenantName, subdomain });

        // Hash Password
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        // Create Admin User
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

const login = async (req, res) => {
    console.log("DEBUG: Auth Controller Loaded");
    const { email, password, tenantSubdomain } = req.body;

    if (!email || !password || !tenantSubdomain) {
        return res.status(400).json({ success: false, message: 'Email, password, and tenant subdomain are required' });
    }

    try {
        const tenant = await findTenantBySubdomain(tenantSubdomain);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        if (tenant.status !== 'active') {
            console.log(`Login failed: Tenant ${tenantSubdomain} is ${tenant.status}`);
            return res.status(403).json({ success: false, message: 'Tenant is suspended or inactive' });
        }

        const user = await findUserByEmailAndTenant(email, tenant.id);
        if (!user) {
            console.log(`Login failed: User not found for email ${email} and tenant ${tenant.id}`);
            return res.status(404).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log(`Login failed: Password mismatch for user ${email}`);
            // DEBUG: 418 I'm a teapot for password mismatch
            return res.status(418).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            console.log(`Login failed: User ${email} is inactive`);
            return res.status(403).json({ success: false, message: 'Account is inactive' });
        }

        // Generate Token
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
                tenant: {
                    id: user.tenant_id,
                    name: user.tenant_name,
                    subdomain: user.subdomain
                }
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
