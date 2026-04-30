const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function updateProducts() {
  console.log('📦 Updating products collection...');
  if (!fs.existsSync('stock_temp.json')) {
    console.error('Run sync scripts first!');
    process.exit(1);
  }
  const stockMap = JSON.parse(fs.readFileSync('stock_temp.json', 'utf8'));
  const entries = Object.entries(stockMap);

  for (let i = 0; i < entries.length; i += 50) {
    const batch = db.batch();
    const chunk = entries.slice(i, i + 50);
    for (const [id, data] of chunk) {
      batch.set(db.collection('products').doc(id), { ...data, id }, { merge: true });
    }
    await batch.commit();
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000)); // Heavy rate limit
  }
  console.log('\n✨ All products updated!');
  process.exit(0);
}

updateProducts().catch(console.error);
