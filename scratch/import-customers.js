const admin = require('firebase-admin');
const XLSX = require('xlsx');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const filePath = 'C:\\Users\\Click\\Desktop\\CustomersList.xlsx';

async function importCustomers() {
  console.log('🚀 Starting Customer Import...');

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Map column names to our database fields
    // Based on inspection: "ناوی کڕیار", "ژمارە مۆبایل", "ناونیشان"
    const customers = data.map(row => ({
      customerName: String(row['ناوی کڕیار'] || '').trim(),
      customerPhoneNumber: String(row['ژمارە مۆبایل'] || '').trim(),
      customerAddress: String(row['ناونیشان'] || '').trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })).filter(c => c.customerName);

    console.log(`📊 Found ${customers.length} valid customers to import.`);

    let batch = db.batch();
    let count = 0;
    let totalImported = 0;

    for (const customer of customers) {
      const docRef = db.collection('customers').doc();
      batch.set(docRef, { ...customer, id: docRef.id });
      count++;
      totalImported++;

      if (count === 500) {
        await batch.commit();
        console.log(`✅ Imported ${totalImported} customers...`);
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`✅ Final batch committed.`);
    }

    console.log(`✨ Successfully imported ${totalImported} customers!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing customers:', error);
    process.exit(1);
  }
}

importCustomers();
