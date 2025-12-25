const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const log = (msg) => {
    console.log(msg);
    try {
        fs.appendFileSync('fix_log.txt', msg + '\n');
    } catch (e) {
        console.error('Error writing to log file:', e);
    }
};

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'saas_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function fix() {
    try {
        log('Connecting to DB...');
        const hash = await bcrypt.hash('password123', 10);
        log(`Generated hash: ${hash}`);

        const res = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE email = 'admin@demo.com' RETURNING id, email, password_hash",
            [hash]
        );

        if (res.rows.length > 0) {
            log(`SUCCESS: Password updated for: ${res.rows[0].email}`);
            log(`New Hash stored: ${res.rows[0].password_hash}`);
        } else {
            log('ERROR: User admin@demo.com not found!');
        }
    } catch (e) {
        log(`FAILED: ${e.toString()}`);
    } finally {
        await pool.end();
    }
}

fix();
