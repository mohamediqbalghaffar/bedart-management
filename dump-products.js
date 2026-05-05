const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function dumpProducts() {
    const snapshot = await db.collection('products').get();
    console.log(`Dumping ${snapshot.size} products:`);
    snapshot.forEach(doc => {
        console.log(`ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
        console.log('---');
    });
}

dumpProducts()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
