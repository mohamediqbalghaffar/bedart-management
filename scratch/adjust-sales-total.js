const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const targetTotal = 644801.58;

    // Find the form
    const formsSnap = await db.collection('selling_forms').where('formNumber', '==', 'PRE-SYSTEM-01').get();
    if (formsSnap.empty) {
        console.log("Could not find the form PRE-SYSTEM-01");
        return;
    }
    const formDoc = formsSnap.docs[0];
    const currentTotal = formDoc.data().totalPrice;
    
    console.log(`Found form ${formDoc.id}. Current total: ${currentTotal}, Target total: ${targetTotal}`);
    
    // Calculate ratio
    const ratio = targetTotal / currentTotal;

    // Fetch products
    const productsSnap = await formDoc.ref.collection('selling_form_products').get();
    
    const batch = db.batch();
    let newCalculatedTotal = 0;
    
    const updates = [];

    productsSnap.forEach(doc => {
        const data = doc.data();
        const newUnitPrice = data.unitPrice * ratio;
        let newLineTotal = Number((data.quantity * newUnitPrice).toFixed(2));
        
        updates.push({
            ref: doc.ref,
            newUnitPrice: newUnitPrice,
            newLineTotal: newLineTotal
        });
        
        newCalculatedTotal += newLineTotal;
    });

    // Adjust the first item for any rounding differences to hit EXACTLY 644801.58
    let difference = targetTotal - newCalculatedTotal;
    difference = Number(difference.toFixed(2));
    
    if (difference !== 0 && updates.length > 0) {
        console.log(`Adjusting rounding difference of ${difference} on the first item.`);
        updates[0].newLineTotal += difference;
        updates[0].newLineTotal = Number(updates[0].newLineTotal.toFixed(2));
        // You can optionally adjust unitPrice for the first item, but lineTotal is the critical one for the sum.
        updates[0].newUnitPrice = updates[0].newLineTotal / (productsSnap.docs[0].data().quantity || 1);
    }

    let finalSum = 0;
    for (const update of updates) {
        batch.update(update.ref, {
            unitPrice: Number(update.newUnitPrice.toFixed(2)),
            lineTotal: update.newLineTotal
        });
        finalSum += update.newLineTotal;
    }

    console.log(`Final calculated sum of all items: ${finalSum.toFixed(2)}`);

    // Update main form
    batch.update(formDoc.ref, {
        totalPrice: targetTotal
    });

    console.log("Committing updates to Firestore...");
    await batch.commit();
    console.log("Done!");
}

run().catch(console.error).finally(() => process.exit(0));
