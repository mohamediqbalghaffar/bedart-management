/**
 * Safe Deduplication Script for BedArt Firestore
 * 
 * Removes duplicate documents created by multiple migration runs.
 * Uses _crmId as the unique key.
 * Prioritizes records with higher migrationRun values.
 */

const admin = require('firebase-admin');

const serviceAccount = require('./service-account-key.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const COLLECTIONS = [
  'product_definitions',
  'customers',
  'suppliers',
  'buying_forms',
  'selling_forms',
  'expenses'
];

const SUBCOLLECTIONS = {
  'selling_forms': 'selling_form_products',
  'buying_forms': 'buying_form_products'
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

async function deduplicateCollection(collectionName) {
  console.log(`🧹 Processing ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  
  const groups = {}; // _crmId -> [doc, ...]
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const crmId = String(data._crmId);
    if (crmId && crmId !== 'undefined') {
      if (!groups[crmId]) groups[crmId] = [];
      groups[crmId].push({ id: doc.id, ref: doc.ref, data });
    }
  });

  let deletedCount = 0;
  const crmIds = Object.keys(groups);
  
  for (const crmId of crmIds) {
    const docs = groups[crmId];
    if (docs.length <= 1) continue;

    // Sort by migrationRun DESC, then by document creation (implicit or manual)
    docs.sort((a, b) => {
      const runA = a.data.migrationRun || 0;
      const runB = b.data.migrationRun || 0;
      return runB - runA; // Newer runs first
    });

    const survivor = docs[0];
    const duplicates = docs.slice(1);

    console.log(`  - Group ${crmId}: Keeping ${survivor.id} (Run ${survivor.data.migrationRun || 0}), deleting ${duplicates.length} dups`);

    for (const dup of duplicates) {
      const subName = SUBCOLLECTIONS[collectionName];
      if (subName) {
        await deleteSubcollection(dup.ref, subName);
      }
      await dup.ref.delete();
      deletedCount++;
    }
  }

  console.log(`  ✅ ${collectionName}: Deleted ${deletedCount} duplicates.`);
}

async function run() {
  console.log('🚀 Starting SAFE deduplication...\n');
  
  for (const col of COLLECTIONS) {
    try {
      await deduplicateCollection(col);
      // Wait a bit between collections
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`  ❌ Error processing ${col}:`, err.message);
    }
  }
  
  console.log('\n✨ Safe deduplication complete!');
  process.exit(0);
}

run().catch(console.error);
