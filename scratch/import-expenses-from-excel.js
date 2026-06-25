const fs = require('fs');
const xlsx = require('xlsx');
const admin = require('firebase-admin');

// ── Firebase Admin Init ──
const serviceAccount = require('../service-account-key.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

function formatDate(d) {
  if (!d) return new Date().toISOString().split('T')[0];
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (typeof d === 'number') { // Excel date number
     const date = new Date((d - (25567 + 2)) * 86400 * 1000); // converting Excel serial to JS date
     return date.toISOString().split('T')[0];
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
}

async function batchWrite(collectionName, docs) {
  const BATCH_SIZE = 50;
  let written = 0;
  
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);
    
    for (const docData of chunk) {
      const ref = db.collection(collectionName).doc();
      batch.set(ref, { ...docData, id: ref.id });
    }
    
    try {
      await batch.commit();
      written += chunk.length;
      console.log(`  ✓ ${collectionName}: ${written}/${docs.length}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`  ❌ Error committing batch for ${collectionName}:`, err.message);
      throw err;
    }
  }
  return written;
}

async function run() {
  const filePath = 'C:/Users/Click/Desktop/خەرجیەکان.xlsx';
  console.log(`Reading ${filePath}...`);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  console.log(`Found ${data.length} records. Mapping...`);
  
  const expensesData = data.map(row => {
    return {
      name: (row['ناوی خەرجی'] || '').toString().trim(),
      note: (row['تێبینی'] || '').toString().trim(),
      amount: Number(row['بڕ']) || 0,
      currency: (row['دراو'] || 'IQD').toString().trim(),
      category: (row['پۆل'] || 'Other').toString().trim(),
      date: formatDate(row['بەروار']),
      importSource: 'خەرجیەکان.xlsx'
    };
  });

  console.log('Uploading to Firestore...');
  await batchWrite('expenses', expensesData);
  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
