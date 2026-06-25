const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function check() {
    const snapshot = await db.collection('products').limit(5).get();
    snapshot.forEach(doc => {
        console.log(`Product ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
    });
}

check().catch(console.error).finally(() => process.exit(0));
