const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteSalesData() {
    console.log("Starting deletion of all sales forms...");
    const formsSnap = await db.collection('selling_forms').get();
    
    if (formsSnap.empty) {
        console.log("No sales forms found.");
        return;
    }
    
    console.log(`Found ${formsSnap.size} sales forms to delete.`);
    
    let deletedCount = 0;
    
    for (const formDoc of formsSnap.docs) {
        const batch = db.batch();
        const formRef = formDoc.ref;
        
        // Queue products subcollection deletion
        const productsSnap = await formRef.collection('selling_form_products').get();
        productsSnap.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Queue payments subcollection deletion
        const paymentsSnap = await formRef.collection('payments').get();
        paymentsSnap.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Queue the main form deletion
        batch.delete(formRef);
        
        await batch.commit();
        deletedCount++;
        
        if (deletedCount % 50 === 0) {
            console.log(`Deleted ${deletedCount} forms...`);
        }
    }
    
    console.log(`Successfully deleted ${deletedCount} sales forms and their subcollections.`);
}

deleteSalesData().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
