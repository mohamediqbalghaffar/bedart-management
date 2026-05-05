const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkStockMovements() {
    console.log('🔍 Fetching stock movements...');
    const snapshot = await db.collection('stock_movements').get();
    console.log(`Found ${snapshot.size} movements.`);
    snapshot.forEach(doc => {
        console.log(`- ID: ${doc.id}, Data:`, doc.data());
    });
}

checkStockMovements()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
