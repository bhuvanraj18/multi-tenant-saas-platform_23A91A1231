const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const logFile = 'hashes_generated.txt';

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'saas_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
    let output = '';
    try {
        console.log('Generating hashes...');
        const adminPass = 'Demo@123';
        const userPass = 'User@123';
        const superPass = 'Admin@123';

        const adminHash = await bcrypt.hash(adminPass, 10);
        const userHash = await bcrypt.hash(userPass, 10);
        const superHash = await bcrypt.hash(superPass, 10);

        output += `Admin Hash (${adminPass}): ${adminHash}\n`;
        output += `User Hash (${userPass}): ${userHash}\n`;
        output += `Super Hash (${superPass}): ${superHash}\n`;

        console.log('Updating DB...');

        // Update Admin
        await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'admin@demo.com'", [adminHash]);
        // Update Users
        await pool.query("UPDATE users SET password_hash = $1 WHERE email IN ('user1@demo.com', 'user2@demo.com')", [userHash]);
        // Update Super Admin
        await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'superadmin@system.com'", [superHash]);

        output += 'Database updated successfully.\n';
        console.log('Done.');

    } catch (e) {
        output += `Error: ${e.toString()}\n`;
        console.error(e);
    } finally {
        fs.writeFileSync(logFile, output);
        await pool.end();
    }
}

run();
