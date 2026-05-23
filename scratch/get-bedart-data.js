const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getData() {
  console.log('--- Suppliers ---');
  const suppliersSnap = await db.collection('suppliers').get();
  suppliersSnap.forEach(doc => {
    const data = doc.data();
    if (data.supplierName && data.supplierName.includes('بێدئاڕت')) {
      console.log(`Found BedArt Supplier: ID=${doc.id}, Name=${data.supplierName}`);
    }
  });

  console.log('\n--- Products ---');
  const productsSnap = await db.collection('products').get();
  const products = [];
  productsSnap.forEach(doc => {
    const data = doc.data();
    products.push({
      id: doc.id,
      productName: data.productName,
      stockLocation: data.stockLocation
    });
  });
  console.log(`Found ${products.length} existing products.`);
  // Log all products
  console.log(JSON.stringify(products, null, 2));

  process.exit(0);
}

getData().catch(console.error);
