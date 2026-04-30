const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const getProductDocId = (name, location) => {
  const nameSlug = name.toLowerCase().replace(/[^\u0600-\u06FFa-z0-9]/g, '-');
  const locationSlug = location.toLowerCase().replace(/\s/g, '');
  return `${nameSlug}-${locationSlug}`;
};

async function syncBuying() {
  console.log('🛒 Processing buying_forms...');
  const stockMap = {};
  const snap = await db.collection('buying_forms').get();
  
  for (const formDoc of snap.docs) {
    const formData = formDoc.data();
    const pSnap = await formDoc.ref.collection('buying_form_products').get();
    
    const batchSize = pSnap.size;
    if (batchSize > 0) {
      const batch = db.batch();
      for (const pDoc of pSnap.docs) {
        const pData = pDoc.data();
        const pId = getProductDocId(pData.productName, formData.stockLocation || 'Warehouse');
        batch.update(pDoc.ref, { productId: pId });
        
        if (!stockMap[pId]) {
          stockMap[pId] = {
            currentQuantity: 0,
            productName: pData.productName,
            category: pData.category || 'Mattress',
            sizeModel: pData.sizeModel || '',
            stockLocation: formData.stockLocation || 'Warehouse',
            unitPrice: 0,
            sellingPrice: 0,
            supplierId: formData.supplierId || ''
          };
        }
        stockMap[pId].currentQuantity += (Number(pData.quantity) || 0);
        stockMap[pId].unitPrice = Math.max(stockMap[pId].unitPrice, pData.unitPrice || 0);
        stockMap[pId].sellingPrice = Math.max(stockMap[pId].sellingPrice, pData.sellingPrice || 0);
      }
      await batch.commit();
      process.stdout.write('.');
    }
  }
  fs.writeFileSync('stock_temp.json', JSON.stringify(stockMap, null, 2));
  console.log('\n✅ Buying sync complete. Data saved to stock_temp.json');
  process.exit(0);
}

syncBuying().catch(console.error);
