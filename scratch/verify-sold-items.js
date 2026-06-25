const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function verify() {
    const snapshot = await db.collection('selling_forms')
        .where('customerName', '==', 'فرۆشراوی پێش سیستەم')
        .get();

    if (snapshot.empty) {
        console.log('No form found.');
        return;
    }

    const formDoc = snapshot.docs[0];
    const productsSnap = await formDoc.ref.collection('selling_form_products').get();

    let hasCorrectId = 0;
    let missingId = 0;
    let hasPurchasePrice = 0;
    let missingPurchasePrice = 0;

    for (const pDoc of productsSnap.docs) {
        const pData = pDoc.data();

        // Check productId is base64 format (not legacy slug format)
        if (pData.productId && !pData.productId.includes('-warehouse')) {
            hasCorrectId++;
        } else {
            missingId++;
            if (missingId <= 3) {
                console.log(`Legacy ID still present: "${pData.productName}" -> "${pData.productId}"`);
            }
        }

        // Check purchasePrice
        if (pData.purchasePrice && pData.purchasePrice > 0) {
            hasPurchasePrice++;
        } else {
            missingPurchasePrice++;
            if (missingPurchasePrice <= 3) {
                console.log(`Missing purchasePrice: "${pData.productName}" -> ${pData.purchasePrice}`);
            }
        }
    }

    console.log(`\n=== Verification Results ===`);
    console.log(`Total items: ${productsSnap.size}`);
    console.log(`Correct productId (base64): ${hasCorrectId} / ${productsSnap.size}`);
    console.log(`Has purchasePrice > 0: ${hasPurchasePrice} / ${productsSnap.size}`);

    // Show a few sample items
    console.log(`\nSample items (first 3):`);
    productsSnap.docs.slice(0, 3).forEach(pDoc => {
        const d = pDoc.data();
        console.log(`  - "${d.productName}": productId=${d.productId?.substring(0, 30)}..., purchasePrice=$${d.purchasePrice}, qty=${d.quantity}`);
    });
}

verify().catch(console.error).finally(() => process.exit(0));
