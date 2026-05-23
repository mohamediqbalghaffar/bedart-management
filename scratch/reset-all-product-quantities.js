const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function resetAllProductQuantities() {
    console.log('🔄 Fetching all products...');
    const snapshot = await db.collection('products').get();
    console.log(`Found ${snapshot.size} products to reset.`);
    
    let resetCount = 0;
    let batch = db.batch();
    let opsCount = 0;
    
    for (const doc of snapshot.docs) {
        batch.update(doc.ref, { currentQuantity: 0 });
        opsCount++;
        resetCount++;
        
        if (opsCount >= 400) {
            await batch.commit();
            console.log(`  ... committed batch: reset ${resetCount} products so far.`);
            batch = db.batch();
            opsCount = 0;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    if (opsCount > 0) {
        await batch.commit();
    }
    
    console.log(`✨ Successfully reset currentQuantity to 0 for all ${resetCount} products.`);
}

resetAllProductQuantities()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
