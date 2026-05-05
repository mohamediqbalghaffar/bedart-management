const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function searchTestItems() {
    const collections = await db.listCollections();
    for (const coll of collections) {
        console.log(`Searching in ${coll.id}...`);
        const snapshot = await coll.get();
        snapshot.forEach(doc => {
            const data = JSON.stringify(doc.data());
            if (data.includes('تێست')) {
                console.log(`- Found in ${coll.id}/${doc.id}`);
                console.log(data);
            }
        });
    }
}

searchTestItems()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
