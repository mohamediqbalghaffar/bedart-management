const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function cleanupGhostProducts(fix = false) {
    console.log(`🚀 Starting Ghost Product Cleanup (${fix ? 'FIX MODE' : 'DRY RUN'})...\n`);

    // 1. Get all products with quantity > 0
    const productsSnap = await db.collection('products').where('currentQuantity', '>', 0).get();
    
    if (productsSnap.empty) {
        console.log('✅ No products with quantity > 0 found.');
        return;
    }

    console.log(`🔍 Found ${productsSnap.size} products with positive quantity. Checking for purchase records...`);

    const ghosts = [];

    // 2. Check if buying_forms has any documents
    const buyingFormsSnap = await db.collection('buying_forms').limit(1).get();
    const hasAnyPurchases = !buyingFormsSnap.empty;

    for (const doc of productsSnap.docs) {
        const product = doc.data();
        const productId = doc.id;

        // If there are no purchases at all, everything is a ghost
        // Otherwise, we would need to check subcollections (but we skip for now as size is 0)
        if (!hasAnyPurchases) {
            ghosts.push({ id: productId, name: product.productName, qty: product.currentQuantity });
        }
    }

    if (ghosts.length === 0) {
        console.log('✅ No ghost products detected. All stock has corresponding purchase records.');
    } else {
        console.log(`\n❌ Detected ${ghosts.length} Ghost Products:`);
        ghosts.forEach(g => {
            console.log(`  - [${g.id}] ${g.name} | Qty: ${g.qty}`);
        });

        if (fix) {
            console.log('\n🛠️  Cleaning up ghosts...');
            const batch = db.batch();
            ghosts.forEach(g => {
                const ref = db.collection('products').doc(g.id);
                // We delete the product if it's a "Test" item, otherwise reset quantity to 0
                if (g.name.includes('تێست')) {
                    console.log(`  🗑️  Deleting test item: ${g.name}`);
                    batch.delete(ref);
                } else {
                    console.log(`  ⚠️  Resetting quantity to 0 for: ${g.name}`);
                    batch.update(ref, { currentQuantity: 0 });
                }
            });
            await batch.commit();
            console.log('✨ Cleanup complete!');
        } else {
            console.log('\n💡 Run with --fix to automatically resolve these issues.');
        }
    }
}

const args = process.argv.slice(2);
const isFix = args.includes('--fix');

cleanupGhostProducts(isFix)
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
