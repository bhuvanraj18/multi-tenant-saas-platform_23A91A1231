const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'database',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'saas_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function debug() {
    try {
        console.log('Connecting to DB...');

        // 1. Check Tenant
        const tenantRes = await pool.query("SELECT * FROM tenants WHERE subdomain = 'demo'");
        if (tenantRes.rows.length === 0) {
            console.log('Tenant "demo" NOT FOUND');
        } else {
            console.log('Tenant "demo" found:', tenantRes.rows[0]);
        }

        // 2. Check User
        const userRes = await pool.query("SELECT * FROM users WHERE email = 'admin@demo.com'");
        if (userRes.rows.length === 0) {
            console.log('User "admin@demo.com" NOT FOUND');
        } else {
            const user = userRes.rows[0];
            console.log('User found:', {
                id: user.id,
                email: user.email,
                tenant_id: user.tenant_id,
                role: user.role,
                is_active: user.is_active,
                password_hash: user.password_hash
            });

            // 3. Test Passwords
            const p1 = 'match123'; // Example
            const p2 = 'password123';
            const p3 = 'Admin@123';

            console.log(`Testing candidates against hash: ${user.password_hash}`);

            console.log(`Check "password123":`, await bcrypt.compare(p2, user.password_hash));
            console.log(`Check "Admin@123":`, await bcrypt.compare(p3, user.password_hash));
        }

    } catch (e) {
        console.error('FAILED:', e);
    } finally {
        await pool.end();
    }
}

debug();
