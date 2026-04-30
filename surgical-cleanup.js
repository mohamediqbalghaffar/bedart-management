/**
 * Surgical Cleanup Script for BedArt Firestore
 * 
 * Safely removes older records that used random document IDs,
 * while preserving new records that use the idempotent format (e.g., selling_form_123).
 */

const admin = require('firebase-admin');

const serviceAccount = require('./service-account-key.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const COLLECTIONS_CONFIG = {
  'product_definitions': { prefix: 'product_', sub: null },
  'customers': { prefix: 'customer_', sub: null },
  'suppliers': { prefix: 'supplier_', sub: null },
  'selling_forms': { prefix: 'selling_form_', sub: 'selling_form_products' },
  'buying_forms': { prefix: 'buying_form_', sub: 'buying_form_products' },
  'expenses': { prefix: 'expense_', sub: null }
};

async function deleteSubcollection(parentRef, subcollectionName) {
  const subSnap = await parentRef.collection(subcollectionName).get();
  const batch = db.batch();
  subSnap.forEach(doc => {
    batch.delete(doc.ref);
  });
  if (subSnap.size > 0) {
    await batch.commit();
  }
}

async function cleanupCollection(colName, config) {
  console.log(`🧹 Cleaning up ${colName}...`);
  const snapshot = await db.collection(colName).get();
  let deletedCount = 0;
  let keptCount = 0;
  let batch = db.batch();
  let opsCount = 0;

  for (const doc of snapshot.docs) {
    const id = doc.id;
    if (id.startsWith(config.prefix)) {
      keptCount++;
      continue;
    }

    try {
      if (config.sub) {
        // Subcollections still need separate handling due to depth, but we can batch them too
        await deleteSubcollection(doc.ref, config.sub);
      }
      
      batch.delete(doc.ref);
      opsCount++;
      deletedCount++;

      if (opsCount >= 400) {
        await batch.commit();
        console.log(`  ... committed batch: deleted ${deletedCount} random-ID records so far from ${colName}`);
        batch = db.batch();
        opsCount = 0;
        // Small delay to avoid hitting rate limits too hard
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      if (err.message.includes('Quota exceeded')) {
        console.error('🛑 Quota exceeded during cleanup. Stopping.');
        process.exit(1);
      }
      console.error(`  ❌ Error adding ${id} to batch:`, err.message);
    }
  }

  if (opsCount > 0) {
    await batch.commit();
  }

  console.log(`  ✅ ${colName}: Kept ${keptCount}, Deleted ${deletedCount}.`);
}

async function run() {
  console.log('🚀 Starting surgical cleanup...\n');
  
  for (const col of Object.keys(COLLECTIONS_CONFIG)) {
    await cleanupCollection(col, COLLECTIONS_CONFIG[col]);
  }
  
  console.log('\n✨ Cleanup finished.');
  process.exit(0);
}

run().catch(console.error);
