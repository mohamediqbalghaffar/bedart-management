const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function findAllStock() {
    const collections = await db.listCollections();
    for (const coll of collections) {
        const snapshot = await coll.get();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.currentQuantity > 0) {
                console.log(`- Found in ${coll.id}/${doc.id}: Name: ${data.productName}, Qty: ${data.currentQuantity}`);
            }
        });
    }
}

findAllStock()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
