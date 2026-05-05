const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function listProductDefs() {
    const snapshot = await db.collection('product_definitions').get();
    console.log(`Found ${snapshot.size} product definitions.`);
    snapshot.forEach(doc => {
        console.log(`- ${doc.data().productName} (Category: ${doc.data().category})`);
    });
}

listProductDefs()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
