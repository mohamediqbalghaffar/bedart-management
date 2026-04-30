/**
 * Deduplication Script for BedArt Firestore
 * 
 * Removes duplicate documents created by multiple migration runs.
 * Uses _crmId as the unique key for all collections.
 */

const admin = require('firebase-admin');

// ── Firebase Admin Init ──
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Collections to deduplicate (focused on user-reported issues to save quota)
const COLLECTIONS = [
  'suppliers',
  'buying_forms',
  'selling_forms',
  'expenses'
];

// Subcollections that need to be deleted when a parent form is deleted
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
    // console.log(`    - Deleted ${subSnap.size} items from ${subcollectionName}`);
  }
}

async function deduplicateCollection(collectionName) {
  console.log(`🧹 Processing ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  
  const groups = {}; // _crmId -> [docRef, ...]
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const crmId = data._crmId;
    
    if (crmId !== undefined) {
      if (!groups[crmId]) groups[crmId] = [];
      groups[crmId].push(doc);
    }
  });

  let deletedCount = 0;
  const groupsToClean = Object.values(groups).filter(g => g.length > 1);
  console.log(`  Found ${groupsToClean.length} groups with duplicates.`);

  for (let i = 0; i < groupsToClean.length; i++) {
    const docs = groupsToClean[i];
    // Keep the first one, delete the rest
    const docsToDelete = docs.slice(1);
    
    for (const doc of docsToDelete) {
      // If it's a form, delete subcollections first
      const subName = SUBCOLLECTIONS[collectionName];
      if (subName) {
        await deleteSubcollection(doc.ref, subName);
      }
      
      await doc.ref.delete();
      deletedCount++;
      // Wait 100ms between deletes to stay under quota
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${groupsToClean.length} duplicate groups cleaned...`);
      // Extra pause every 50 groups
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`  ✅ ${collectionName}: Deleted ${deletedCount} duplicates.`);
}

async function run() {
  console.log('🚀 Starting deduplication process...\n');
  
  for (const col of COLLECTIONS) {
    try {
      await deduplicateCollection(col);
      console.log(`  Waiting 10 seconds before next collection...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (err) {
      console.error(`  ❌ Error processing ${col}:`, err.message);
    }
  }
  
  console.log('\n✨ Deduplication complete!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
