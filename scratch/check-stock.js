const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function check() {
    // Let's get the selling form PRE-SYSTEM-01
    const snapshot = await db.collection('selling_forms')
        .where('customerName', '==', 'فرۆشراوی پێش سیستەم')
        .get();
        
    if (snapshot.empty) {
        console.log('No sales form found.');
        return;
    }
    
    const formDoc = snapshot.docs[0];
    const productsSnap = await formDoc.ref.collection('selling_form_products').get();
    
    console.log(`Analyzing ${productsSnap.size} products from the pre-system form...`);
    
    let sampleCount = 0;
    for (const pDoc of productsSnap.docs) {
        const pData = pDoc.data();
        const pId = pData.productId;
        
        if (!pId) {
            console.log(`Product "${pData.productName}" has no productId!`);
            continue;
        }
        
        const pSnap = await db.collection('products').doc(pId).get();
        if (!pSnap.exists) {
            console.log(`Product ID "${pId}" does not exist in 'products' collection!`);
        } else {
            const prodData = pSnap.data();
            if (sampleCount < 10) {
                console.log(`Product: "${pData.productName}"`);
                console.log(`  - Sold Quantity: ${pData.quantity}`);
                console.log(`  - Current Quantity in Stock: ${prodData.currentQuantity}`);
                console.log(`  - Stock Location: ${prodData.stockLocation}`);
                sampleCount++;
            }
        }
    }
}

check().catch(console.error).finally(() => process.exit(0));
