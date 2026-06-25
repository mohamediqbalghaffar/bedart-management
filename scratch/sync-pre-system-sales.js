const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function syncPreSystemSales() {
    console.log('=== Syncing Pre-System Sales Form ===\n');

    // 1. Find the pre-system form
    const formSnap = await db.collection('selling_forms')
        .where('customerName', '==', 'فرۆشراوی پێش سیستەم')
        .get();

    if (formSnap.empty) {
        console.error('❌ No pre-system sales form found!');
        return;
    }

    const formDoc = formSnap.docs[0];
    console.log(`Found form: ${formDoc.id} (${formDoc.data().formNumber})`);

    // 2. Load all products from 'products' collection, indexed by name+location
    const productsSnap = await db.collection('products').get();
    const productsMap = new Map();
    productsSnap.forEach(doc => {
        const data = doc.data();
        const key = `${data.productName.trim()}||${data.stockLocation}`;
        productsMap.set(key, { docId: doc.id, ref: doc.ref, ...data });
    });
    console.log(`Loaded ${productsMap.size} products from 'products' collection.\n`);

    // 3. Load all selling_form_products for this form
    const soldItemsSnap = await formDoc.ref.collection('selling_form_products').get();
    console.log(`Found ${soldItemsSnap.size} sold items in the form.\n`);

    // 4. Prepare batch updates
    // Firestore max batch size is 500 writes. We have 369 sold items + 369 product updates = 738.
    // We need to split into multiple batches.
    const updates = [];

    let matched = 0;
    let unmatched = 0;

    for (const soldDoc of soldItemsSnap.docs) {
        const soldData = soldDoc.data();
        const productName = soldData.productName.trim();
        const key = `${productName}||Warehouse`;

        const product = productsMap.get(key);
        if (!product) {
            console.log(`⚠️  No matching product for: "${productName}"`);
            unmatched++;
            continue;
        }

        matched++;

        // Update the selling_form_products doc with correct productId, purchasePrice, sizeModel, category
        updates.push({
            type: 'updateSoldItem',
            ref: soldDoc.ref,
            data: {
                productId: product.docId,
                purchasePrice: product.unitPrice || 0,
                sizeModel: product.sizeModel || '',
                category: product.category || soldData.category || 'Mattress',
            }
        });

        // Deduct quantity from the product's currentQuantity
        updates.push({
            type: 'deductStock',
            ref: product.ref,
            deductBy: Number(soldData.quantity) || 0,
            productName: productName,
            currentQty: product.currentQuantity,
        });
    }

    console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);
    console.log(`Total updates to commit: ${updates.length}\n`);

    if (unmatched > 0) {
        console.error('❌ Some products could not be matched. Aborting to prevent data inconsistency.');
        return;
    }

    // 5. Execute in batches of 450 (safe limit under 500)
    const BATCH_SIZE = 450;
    let batchCount = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const chunk = updates.slice(i, i + BATCH_SIZE);
        const batch = db.batch();

        for (const update of chunk) {
            if (update.type === 'updateSoldItem') {
                batch.update(update.ref, update.data);
            } else if (update.type === 'deductStock') {
                const newQty = (update.currentQty || 0) - update.deductBy;
                batch.update(update.ref, { currentQuantity: newQty });
            }
        }

        await batch.commit();
        batchCount++;
        console.log(`✅ Batch ${batchCount} committed (${chunk.length} writes).`);
    }

    console.log(`\n🎉 Sync complete! ${batchCount} batches committed.`);
    console.log(`   - ${matched} sold items updated with correct productId & purchasePrice`);
    console.log(`   - ${matched} product stock quantities deducted`);
}

syncPreSystemSales().catch(console.error).finally(() => process.exit(0));
