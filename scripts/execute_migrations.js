// scripts/execute_migrations.js
// Reads and executes the new SQL migrations using the pg client over DATABASE_URL.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Check if DATABASE_URL is set
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL must be set in .env');
  console.error('Format: DATABASE_URL="postgresql://postgres:[PASSWORD]@db.pedhthbsbafqybshaefv.supabase.co:5432/postgres"');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false // Required for Supabase SSL connections
  }
});

const migrationFiles = [
  '20260722000000_dynamic_rbac.sql',
  '20260722000100_relational_master_data.sql',
  '20260722000200_auto_seed_onboarding.sql'
];

async function runMigrations() {
  console.log('🚀 Connecting to PostgreSQL database...');
  await client.connect();
  console.log('✅ Connected successfully!');

  for (const filename of migrationFiles) {
    const filePath = path.join(__dirname, '../supabase/migrations', filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      continue;
    }
    
    console.log(`\n📄 Reading migration: ${filename}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`⚡ Executing SQL query...`);
    try {
      // Execute migration in a single transaction block for safety
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✅ Migration SUCCESSFUL: ${filename}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration FAILED: ${filename}`);
      console.error('Error details:', err.message || err);
      await client.end();
      process.exit(1);
    }
  }
  
  await client.end();
  console.log('\n🎉 All migrations completed successfully!');
}

runMigrations().catch(async (err) => {
  console.error('❌ Unexpected error running migrations:', err);
  try {
    await client.end();
  } catch (e) {}
  process.exit(1);
});
