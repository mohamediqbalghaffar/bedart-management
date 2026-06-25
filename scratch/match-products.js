const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function run() {
    const snapshot = await db.collection('selling_forms')
        .where('customerName', '==', 'فرۆشراوی پێش سیستەم')
        .get();
        
    if (snapshot.empty) {
        console.log('No form found.');
        return;
    }
    
    const formDoc = snapshot.docs[0];
    const productsSnap = await formDoc.ref.collection('selling_form_products').get();
    
    console.log(`Form products count: ${productsSnap.size}`);
    
    let matched = 0;
    let unmatched = 0;
    
    const productsListSnap = await db.collection('products').get();
    const productsMap = new Map();
    productsListSnap.forEach(doc => {
        const data = doc.data();
        // Index by productName + stockLocation
        const key = `${data.productName.trim()}||${data.stockLocation}`;
        productsMap.set(key, { id: doc.id, ...data });
    });
    
    console.log(`Loaded ${productsMap.size} products from 'products' collection.`);
    
    for (const pDoc of productsSnap.docs) {
        const pData = pDoc.data();
        const name = pData.productName.trim();
        // Since the pre-system form sold items from the Warehouse, we look for 'Warehouse' location
        const key = `${name}||Warehouse`;
        
        const matchedProduct = productsMap.get(key);
        if (matchedProduct) {
            matched++;
        } else {
            unmatched++;
            if (unmatched <= 10) {
                console.log(`Unmatched: "${name}"`);
            }
        }
    }
    
    console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);
}

run().catch(console.error).finally(() => process.exit(0));
