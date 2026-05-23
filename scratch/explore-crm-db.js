const sql = require('mssql');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const config = {
  server: 'localhost',
  authentication: { type: 'default', options: { userName: 'sa', password: '' } },
  options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
};

async function exploreDB() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');

    // List all databases
    const dbs = await pool.request().query(`SELECT name FROM sys.databases WHERE name NOT IN ('master','tempdb','model','msdb') ORDER BY name`);
    console.log('\n📦 Databases:');
    dbs.recordset.forEach(r => console.log(' -', r.name));

  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    if (pool) await pool.close();
  }
}

exploreDB();
