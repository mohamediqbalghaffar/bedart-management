const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function test() {
  try {
    const snap = await db.collection('suppliers').limit(1).get();
    console.log('✅ Success! Suppliers found:', snap.size);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
  process.exit(0);
}
test();
