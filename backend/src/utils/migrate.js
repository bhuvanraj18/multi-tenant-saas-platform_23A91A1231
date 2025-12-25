const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const runMigrations = async (retries = 5, delay = 2000) => {
    while (retries > 0) {
        try {
            console.log(`Attempting migration... (${retries} retries left)`);
            // Test connection first
            await db.query('SELECT 1');
            break;
        } catch (err) {
            console.error('Database not ready, retrying...', err.message);
            retries--;
            if (retries === 0) {
                console.error('Max retries reached. Exiting.');
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }

    try {
        const migrationsDir = path.join(__dirname, '../../migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        console.log('Running migrations...');
        for (const file of files) {
            if (file.endsWith('.sql')) {
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                console.log(`Executing ${file}...`);
                await db.query(sql);
            }
        }

        console.log('Running seeds...');
        const seedFile = path.join(__dirname, '../../seeds/seed_data.sql');
        if (fs.existsSync(seedFile)) {
            const seedSql = fs.readFileSync(seedFile, 'utf8');
            // Simple split by semicolon might fail for complex seeds, but works for simple ones
            // Better to read the whole file if pg allows multiple statements (it does)
            await db.query(seedSql);
            console.log('Seeds executed.');
        }

        console.log('Database initialized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigrations();
