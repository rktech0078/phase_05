/* eslint-disable */
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function resetDb() {
    try {
        console.log('🗑️  Dropping all tables...');
        // Drop tables in correct order (tasks depends on users maps to user now but old one was users)
        await pool.query('DROP TABLE IF EXISTS tasks CASCADE');
        await pool.query('DROP TABLE IF EXISTS "user" CASCADE');
        await pool.query('DROP TABLE IF EXISTS "users" CASCADE');
        await pool.query('DROP TABLE IF EXISTS "session" CASCADE');
        await pool.query('DROP TABLE IF EXISTS "account" CASCADE');
        await pool.query('DROP TABLE IF EXISTS "verification" CASCADE');

        console.log('✅ Tables dropped successfully.');
    } catch (err) {
        console.error('❌ Error dropping tables:', err);
    } finally {
        await pool.end();
    }
}

resetDb();
