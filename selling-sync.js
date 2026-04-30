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

async function syncSelling() {
  console.log('🧾 Processing selling_forms...');
  if (!fs.existsSync('stock_temp.json')) {
    console.error('Run buying-sync.js first!');
    process.exit(1);
  }
  const stockMap = JSON.parse(fs.readFileSync('stock_temp.json', 'utf8'));
  const snap = await db.collection('selling_forms').get();

  for (let i = 0; i < snap.docs.length; i++) {
    const formDoc = snap.docs[i];
    const pSnap = await formDoc.ref.collection('selling_form_products').get();
    
    if (pSnap.size > 0) {
      const batch = db.batch();
      for (const pDoc of pSnap.docs) {
        const pData = pDoc.data();
        const pId = getProductDocId(pData.productName, 'Warehouse');
        batch.update(pDoc.ref, { productId: pId });
        
        if (!stockMap[pId]) {
          stockMap[pId] = {
            currentQuantity: 0,
            productName: pData.productName,
            category: pData.category || 'Mattress',
            sizeModel: '',
            stockLocation: 'Warehouse',
            unitPrice: 0,
            sellingPrice: pData.unitPrice || 0,
            supplierId: ''
          };
        }
        stockMap[pId].currentQuantity -= (Number(pData.quantity) || 0);
      }
      await batch.commit();
    }
    if (i % 20 === 0) {
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  fs.writeFileSync('stock_temp.json', JSON.stringify(stockMap, null, 2));
  console.log('\n✅ Selling sync complete. Data updated in stock_temp.json');
  process.exit(0);
}

syncSelling().catch(console.error);
