const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function findBedArt() {
    console.log('🔍 Searching for BedArt supplier...');
    const snapshot = await db.collection('suppliers').where('supplierName', '==', 'BedArt').get();
    
    if (snapshot.empty) {
        console.log('❌ BedArt supplier not found.');
        // List all suppliers to see what we have
        const allSuppliers = await db.collection('suppliers').get();
        console.log('All suppliers:');
        allSuppliers.forEach(doc => {
            console.log(`- ${doc.data().supplierName} (ID: ${doc.id})`);
        });
        return;
    }

    const bedArt = snapshot.docs[0];
    console.log(`✅ Found BedArt! ID: ${bedArt.id}`);

    console.log('🔍 Searching for purchases from BedArt...');
    // We can't query by supplierId easily if the collection is missing, 
    // but maybe we can search ALL collections for this supplierId.
    
    const collections = await db.listCollections();
    for (const coll of collections) {
        const docs = await coll.where('supplierId', '==', bedArt.id).get();
        if (!docs.empty) {
            console.log(`- Found ${docs.size} documents in collection "${coll.id}" with supplierId ${bedArt.id}`);
            docs.forEach(d => console.log(`  - Doc ID: ${d.id}`));
        }
    }
}

findBedArt()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
