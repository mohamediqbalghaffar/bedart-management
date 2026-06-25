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
    
    const productsListSnap = await db.collection('products').get();
    const productsMap = new Map();
    productsListSnap.forEach(doc => {
        const data = doc.data();
        const key = `${data.productName.trim()}||${data.stockLocation}`;
        productsMap.set(key, { id: doc.id, ...data });
    });
    
    let totalItems = 0;
    let insufficientStockCount = 0;
    
    for (const pDoc of productsSnap.docs) {
        const pData = pDoc.data();
        const name = pData.productName.trim();
        const key = `${name}||Warehouse`;
        const product = productsMap.get(key);
        
        if (product) {
            totalItems++;
            const diff = product.currentQuantity - pData.quantity;
            if (diff < 0) {
                insufficientStockCount++;
                if (insufficientStockCount <= 5) {
                    console.log(`Product "${name}": current stock is ${product.currentQuantity}, sold quantity is ${pData.quantity} (underflow by ${-diff})`);
                }
            }
        }
    }
    console.log(`Summary: checked ${totalItems} items. Insufficient stock on ${insufficientStockCount} items.`);
}

run().catch(console.error).finally(() => process.exit(0));
