const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function deepSearch() {
    const collections = await db.listCollections();
    for (const coll of collections) {
        const snapshot = await coll.get();
        snapshot.forEach(doc => {
            const data = JSON.stringify(doc.data());
            if (data.includes('BedArt')) {
                console.log(`- Found in ${coll.id}/${doc.id}`);
            }
        });
    }
}

deepSearch()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
