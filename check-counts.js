const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCounts() {
  const collections = ['product_definitions', 'customers', 'suppliers', 'selling_forms', 'buying_forms', 'expenses'];
  console.log('📊 Current Collection Counts:');
  for (const col of collections) {
    const snap = await db.collection(col).count().get();
    console.log(`  ${col}: ${snap.data().count}`);
  }
}

checkCounts().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
