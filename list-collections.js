const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function listCollections() {
    const collections = await db.listCollections();
    console.log('Top-level collections:');
    collections.forEach(collection => {
        console.log(`- ${collection.id}`);
    });
}

listCollections()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
