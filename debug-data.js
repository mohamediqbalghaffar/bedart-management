const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function debugData() {
    const collections = await db.listCollections();
    console.log('Collections:');
    for (const coll of collections) {
        const snap = await coll.limit(1).get();
        console.log(`- ${coll.id} (size: ${snap.empty ? 0 : '>=1'})`);
    }

    console.log('\nChecking buying_forms explicitly:');
    const bfSnap = await db.collection('buying_forms').get();
    console.log(`buying_forms size: ${bfSnap.size}`);
}

debugData()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
