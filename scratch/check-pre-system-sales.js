const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function check() {
    console.log('Searching for sales forms with customerName: "فرۆشراوی پێش سیستەم"...');
    const snapshot = await db.collection('selling_forms')
        .where('customerName', '==', 'فرۆشراوی پێش سیستەم')
        .get();
        
    if (snapshot.empty) {
        console.log('No sales form found for "فرۆشراوی پێش سیستەم".');
        return;
    }
    
    console.log(`Found ${snapshot.size} forms:`);
    for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log(`Form ID: ${doc.id}`);
        console.log(`Form Number: ${data.formNumber}`);
        console.log(`Issue Date: ${data.issueDate}`);
        console.log(`Total Price: ${data.totalPrice}`);
        console.log(`Note: ${data.note}`);
        
        const productsSnap = await doc.ref.collection('selling_form_products').get();
        console.log(`Contains ${productsSnap.size} products.`);
        if (productsSnap.size > 0) {
            console.log("First 3 products:");
            productsSnap.docs.slice(0, 3).forEach(pDoc => {
                console.log(`  - ${pDoc.data().productName} (ID: ${pDoc.data().productId || 'none'}): quantity = ${pDoc.data().quantity}, price = ${pDoc.data().unitPrice}`);
            });
        }
    }
}

check().catch(console.error).finally(() => process.exit(0));
