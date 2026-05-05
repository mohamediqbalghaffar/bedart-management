const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function listAllProducts() {
    const snapshot = await db.collection('products').get();
    console.log(`Found ${snapshot.size} products.`);
    snapshot.forEach(doc => {
        console.log(`- ID: ${doc.id}, Name: ${doc.data().productName}, Quantity: ${doc.data().currentQuantity}`);
    });
}

listAllProducts()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
