const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');
const fs = require('fs');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const netStock = JSON.parse(fs.readFileSync('d:/bedart-management/scratch/netStock.json', 'utf8'));
    console.log(`Loaded ${netStock.length} items to sell.`);
    
    if (netStock.length === 0) {
        console.log("Nothing to sell.");
        return;
    }

    const formRef = db.collection('selling_forms').doc();
    let totalPrice = 0;
    
    // We will batch the operations since there are 369 items. Firestore allows max 500 writes per batch.
    // 1 form + 369 items = 370 writes, fits in ONE batch!
    const batch = db.batch();

    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < netStock.length; i++) {
        const item = netStock[i];
        const quantity = item.remaining;
        const unitPrice = item.unitPrice || 0;
        const lineTotal = quantity * unitPrice;
        totalPrice += lineTotal;

        const itemRef = formRef.collection('selling_form_products').doc();
        batch.set(itemRef, {
            id: itemRef.id,
            sellingFormId: formRef.id,
            productId: item.id || '',
            productName: item.name,
            quantity: quantity,
            unitPrice: unitPrice,
            lineTotal: Number(lineTotal.toFixed(2)),
            category: item.category || 'Other'
        });
    }

    // Now set the form itself
    batch.set(formRef, {
        id: formRef.id,
        formNumber: "PRE-SYSTEM-01",
        customerName: "فرۆشراوی پێش سیستەم",
        customerPhoneNumber: "00",
        customerAddress: "سیستمی کۆنەکە",
        issueDate: today,
        paymentType: "Direct Payment",
        paymentStatus: "Fully Paid",
        totalPrice: Number(totalPrice.toFixed(2)),
        remainingBalance: 0,
        discountValue: 0,
        deliveryCost: 0,
        creatorName: "System Automation",
        creatorId: "system",
        note: "Automatically created to clear warehouse stock."
    });

    console.log("Committing to Firestore...");
    await batch.commit();
    console.log(`Successfully created selling form ${formRef.id} and sold ${netStock.length} unique products.`);
}

run().catch(console.error).finally(() => process.exit(0));
