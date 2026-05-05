const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function detectGhostProducts() {
    console.log('🔍 Fetching all products...');
    const productsSnapshot = await db.collection('products').get();
    const products = [];
    productsSnapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Found ${products.length} products.`);

    console.log('🔍 Fetching all purchase records...');
    const buyingFormsSnapshot = await db.collection('buying_forms').get();
    console.log(`Found ${buyingFormsSnapshot.size} buying forms.`);
    const purchasedProductIds = new Set();

    for (const formDoc of buyingFormsSnapshot.docs) {
        const productsRef = db.collection('buying_forms').doc(formDoc.id).collection('buying_form_products');
        const productsSnapshot = await productsRef.get();
        console.log(`Form ${formDoc.id} has ${productsSnapshot.size} products.`);
        productsSnapshot.forEach(pDoc => {
            const data = pDoc.data();
            if (data.productId) {
                purchasedProductIds.add(data.productId);
            } else {
                console.warn(`Warning: Product in form ${formDoc.id} has no productId:`, data);
            }
        });
    }
    console.log(`Found ${purchasedProductIds.size} unique purchased product IDs.`);

    const ghostProducts = products.filter(p => !purchasedProductIds.has(p.id) && p.currentQuantity > 0);

    if (ghostProducts.length > 0) {
        console.log('\n⚠️ Found ghost products (in inventory but never purchased):');
        ghostProducts.forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.productName}, Quantity: ${p.currentQuantity}, Location: ${p.stockLocation}`);
        });
        
        return ghostProducts;
    } else {
        console.log('\n✅ No ghost products found with quantity > 0.');
        return [];
    }
}

detectGhostProducts()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
