const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const getProductDocId = (name, location) => {
  const nameSlug = name.toLowerCase().replace(/[^\u0600-\u06FFa-z0-9]/g, '-');
  const locationSlug = location.toLowerCase().replace(/\s/g, '');
  return `${nameSlug}-${locationSlug}`;
};

async function syncData() {
  console.log('🚀 Starting Robust Synchronization...\n');

  const stockMap = new Map();

  // 1. BUYING FORMS
  console.log('🛒 Processing buying_forms...');
  const buyingFormsSnap = await db.collection('buying_forms').get();
  for (const formDoc of buyingFormsSnap.docs) {
    const formData = formDoc.data();
    const productsSnap = await formDoc.ref.collection('buying_form_products').get();
    
    let batch = db.batch();
    let batchSize = 0;

    for (const productDoc of productsSnap.docs) {
      const pData = productDoc.data();
      const productId = getProductDocId(pData.productName, formData.stockLocation || 'Warehouse');
      
      if (pData.productId !== productId) {
        batch.update(productDoc.ref, { productId });
        batchSize++;
      }

      if (!stockMap.has(productId)) {
        stockMap.set(productId, {
          currentQuantity: 0,
          productName: pData.productName,
          category: pData.category || 'Mattress',
          sizeModel: pData.sizeModel || '',
          stockLocation: formData.stockLocation || 'Warehouse',
          unitPrice: 0,
          sellingPrice: 0,
          supplierId: formData.supplierId || ''
        });
      }
      const stock = stockMap.get(productId);
      stock.currentQuantity += (Number(pData.quantity) || 0);
      stock.unitPrice = Math.max(stock.unitPrice, pData.unitPrice || 0);
      stock.sellingPrice = Math.max(stock.sellingPrice, pData.sellingPrice || 0);
    }
    if (batchSize > 0) {
      await batch.commit();
      process.stdout.write('b');
      await new Promise(r => setTimeout(r, 200));
    }
  }
  console.log('\n✅ Buying forms processed.');

  // 2. SELLING FORMS
  console.log('\n🧾 Processing selling_forms...');
  const sellingFormsSnap = await db.collection('selling_forms').get();
  console.log(`Summary: ${sellingFormsSnap.size} forms found.`);

  for (let i = 0; i < sellingFormsSnap.docs.length; i++) {
    const formDoc = sellingFormsSnap.docs[i];
    const productsSnap = await formDoc.ref.collection('selling_form_products').get();
    
    let batch = db.batch();
    let batchSize = 0;

    for (const productDoc of productsSnap.docs) {
      const pData = productDoc.data();
      const productId = getProductDocId(pData.productName, 'Warehouse');
      
      if (pData.productId !== productId) {
        batch.update(productDoc.ref, { productId });
        batchSize++;
      }

      if (!stockMap.has(productId)) {
        stockMap.set(productId, {
          currentQuantity: 0,
          productName: pData.productName,
          category: pData.category || 'Mattress',
          sizeModel: '',
          stockLocation: 'Warehouse',
          unitPrice: 0,
          sellingPrice: pData.unitPrice || 0,
          supplierId: ''
        });
      }
      const stock = stockMap.get(productId);
      stock.currentQuantity -= (Number(pData.quantity) || 0);
    }
    
    if (batchSize > 0) {
      await batch.commit();
      process.stdout.write('s');
    }
    if (i % 20 === 0) {
       process.stdout.write('.');
       await new Promise(r => setTimeout(r, 1000)); // Rate limit
    }
  }
  console.log('\n✅ Selling forms processed.');

  // 3. UPDATE PRODUCTS
  console.log('\n📦 Updating products (Stock) collection...');
  const entries = Array.from(stockMap.entries());
  for (let i = 0; i < entries.length; i += 50) {
    const batch = db.batch();
    const chunk = entries.slice(i, i + 50);
    for (const [id, data] of chunk) {
      batch.set(db.collection('products').doc(id), { ...data, id }, { merge: true });
    }
    await batch.commit();
    process.stdout.write('p');
    await new Promise(r => setTimeout(r, 2000)); // Heavy rate limit
  }

  console.log('\n✨ All Sync Complete!');
  process.exit(0);
}

syncData().catch(e => { console.error(e); process.exit(1); });
