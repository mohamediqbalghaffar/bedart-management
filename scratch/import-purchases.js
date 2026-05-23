const admin = require('firebase-admin');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// The BedArt Supplier ID
const BEDART_SUPPLIER_ID = 'etCYxxgdgPQC1mWMA3is';
const BEDART_SUPPLIER_NAME = 'بێدئاڕت';

const DIRECTORY_PATH = 'C:\\Users\\Click\\Desktop\\the 36 extracted files';

function normalizeKurdishText(text) {
  if (!text) return '';
  return String(text)
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/ة/g, 'ە')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeProductId(productName, sizeModel, stockLocation) {
  const key = `${(productName || '').trim()}||${(sizeModel || '').trim()}||${stockLocation}`;
  try {
    const b64 = Buffer.from(unescape(encodeURIComponent(key))).toString('base64');
    return b64.replace(/[+/=]/g, '_').slice(0, 80);
  } catch {
    return key.replace(/[^\w\u0600-\u06FF\u0660-\u0669-]/g, '_').slice(0, 80);
  }
}

async function runImport() {
  console.log('🚀 Starting Imports from 35 Excel Files...');
  
  // Read existing products to avoid duplicating if IDs changed slightly or to match existing names if needed.
  // Actually, makeProductId is deterministic with the normalized name.
  // We will keep a local map of stock updates to apply them together at the end.
  const stockMap = new Map();

  const files = fs.readdirSync(DIRECTORY_PATH).filter(f => f.endsWith('.xlsx'));
  console.log(`Found ${files.length} Excel files.`);

  let formCount = 0;

  for (const file of files) {
    const filePath = path.join(DIRECTORY_PATH, file);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Skip the header (Row 0)
    const rows = data.slice(1);
    
    let totalPrice = 0;
    const formProducts = [];

    for (const row of rows) {
      if (!row || !row[0]) continue; // Skip empty rows

      const rawName = row[0];
      const normalizedName = normalizeKurdishText(rawName);
      const quantity = Number(row[1]) || 0;
      const unitPrice = Number(row[2]) || 0;
      const sellingPrice = Number(row[3]) || 0;
      
      if (quantity <= 0) continue;

      const lineTotal = quantity * unitPrice;
      totalPrice += lineTotal;

      const stockLocation = 'Warehouse';
      const sizeModel = ''; // Size is included in the name
      const productId = makeProductId(normalizedName, sizeModel, stockLocation);

      formProducts.push({
        productId,
        productName: normalizedName,
        quantity,
        unitPrice,
        sellingPrice,
        lineTotal
      });

      // Track stock globally to update products collection
      if (!stockMap.has(productId)) {
        stockMap.set(productId, {
          productName: normalizedName,
          category: 'Mattress', // default
          sizeModel: '',
          stockLocation: stockLocation,
          unitPrice: unitPrice,
          sellingPrice: sellingPrice,
          supplierId: BEDART_SUPPLIER_ID,
          currentQuantity: 0
        });
      }
      
      const stock = stockMap.get(productId);
      stock.currentQuantity += quantity;
      // Keep the highest prices
      stock.unitPrice = Math.max(stock.unitPrice, unitPrice);
      stock.sellingPrice = Math.max(stock.sellingPrice, sellingPrice);
    }

    if (formProducts.length === 0) {
      console.log(`⚠️ Skipped ${file}: No valid products found.`);
      continue;
    }

    // Create the buying form batch
    const batch = db.batch();
    const formRef = db.collection('buying_forms').doc();
    const issueDate = new Date().toISOString().split('T')[0]; // Today's date
    const formNumber = `BF-EXT-${file.replace('.xlsx', '')}`;

    batch.set(formRef, {
      formNumber,
      supplierId: BEDART_SUPPLIER_ID,
      supplierName: BEDART_SUPPLIER_NAME,
      issueDate,
      totalPrice,
      remainingBalance: totalPrice,
      paymentStatus: 'Unpaid',
      paymentType: 'Direct Payment',
      stockLocation: 'Warehouse',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    for (const p of formProducts) {
      const pRef = formRef.collection('buying_form_products').doc();
      batch.set(pRef, p);
    }

    await batch.commit();
    formCount++;
    console.log(`✅ Created form ${formNumber} with ${formProducts.length} items (Total: ${totalPrice})`);
  }

  console.log(`\n📦 Processed ${formCount} forms. Now updating stock...`);

  // Update Stock
  const stockEntries = Array.from(stockMap.entries());
  let stockBatch = db.batch();
  let count = 0;
  let updatedCount = 0;

  for (const [productId, stockData] of stockEntries) {
    const prodRef = db.collection('products').doc(productId);
    
    // We use increment to safely add to existing stock
    stockBatch.set(prodRef, {
      id: productId,
      productName: stockData.productName,
      category: stockData.category,
      sizeModel: stockData.sizeModel,
      stockLocation: stockData.stockLocation,
      supplierId: stockData.supplierId,
      // If product exists, we merge and increment. If it doesn't, it creates it with currentQuantity
      currentQuantity: admin.firestore.FieldValue.increment(stockData.currentQuantity),
      unitPrice: stockData.unitPrice,
      sellingPrice: stockData.sellingPrice
    }, { merge: true });

    count++;
    updatedCount++;

    if (count === 400) {
      await stockBatch.commit();
      stockBatch = db.batch();
      count = 0;
      console.log(`   ...updated ${updatedCount} products`);
    }
  }

  if (count > 0) {
    await stockBatch.commit();
    console.log(`   ...updated ${updatedCount} products`);
  }

  console.log('✨ All imports and stock synchronizations are complete!');
  process.exit(0);
}

runImport().catch(e => {
  console.error('❌ Error during import:', e);
  process.exit(1);
});
