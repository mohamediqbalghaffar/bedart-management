const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const stock = {};

    console.log('Fetching buying items...');
    const buyingSnap = await db.collectionGroup('buying_form_products').get();
    buyingSnap.forEach(doc => {
        const data = doc.data();
        const key = data.productName;
        if (!stock[key]) stock[key] = { bought: 0, sold: 0, category: data.category, unitPrice: data.sellingPrice || data.unitPrice || 0, id: data.productId || '' };
        stock[key].bought += (data.quantity || 0);
    });

    console.log('Fetching selling items...');
    const sellingSnap = await db.collectionGroup('selling_form_products').get();
    sellingSnap.forEach(doc => {
        const data = doc.data();
        const key = data.productName;
        if (!stock[key]) stock[key] = { bought: 0, sold: 0, category: data.category, unitPrice: data.unitPrice || 0, id: data.productId || '' };
        stock[key].sold += (data.quantity || 0);
    });

    const netStock = [];
    for (const [name, stats] of Object.entries(stock)) {
        const remaining = stats.bought - stats.sold;
        if (remaining > 0) {
            netStock.push({ name, remaining, category: stats.category, unitPrice: stats.unitPrice, id: stats.id });
        }
    }

    console.log(`Found ${netStock.length} items with positive stock.`);
    const fs = require('fs');
    fs.writeFileSync('d:/bedart-management/scratch/netStock.json', JSON.stringify(netStock, null, 2));
    console.log('Saved to netStock.json');
}

run().catch(console.error).finally(() => process.exit(0));
