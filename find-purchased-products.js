const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function findPurchasedProducts() {
    console.log('🔍 Searching for all buying_form_products...');
    const snapshot = await db.collectionGroup('buying_form_products').get();
    console.log(`Found ${snapshot.size} documents in buying_form_products.`);
    
    snapshot.forEach(doc => {
        console.log(`- Path: ${doc.ref.path}, ProductId: ${doc.data().productId}`);
    });
}

findPurchasedProducts()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
