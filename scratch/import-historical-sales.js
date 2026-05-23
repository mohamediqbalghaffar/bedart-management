const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Path to the raw JSON file extracted from SQL
const JSON_PATH = 'C:\\Users\\Click\\.gemini\\antigravity\\scratch\\all_sales.json';

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
  console.log('🚀 Starting Imports of Historical Sales Forms...');
  
  if (!fs.existsSync(JSON_PATH)) {
      console.error(`❌ Cannot find file at ${JSON_PATH}`);
      process.exit(1);
  }

  const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
  // Strip BOM if present
  const data = JSON.parse(rawData.replace(/^\uFEFF/, ''));
  console.log(`Loaded ${data.length} individual items from JSON.`);

  // Group by form_id
  const forms = new Map();
  for (const row of data) {
      if (!row.form_id) continue;
      
      if (!forms.has(row.form_id)) {
          let dateStr = new Date().toISOString().split('T')[0];
          if (row.date && typeof row.date === 'string' && row.date.includes('Date')) {
              const ms = parseInt(row.date.match(/\d+/)[0]);
              dateStr = new Date(ms).toISOString().split('T')[0];
          }
          
          forms.set(row.form_id, {
              form_id: row.form_id,
              customer_name: normalizeKurdishText(row.customer_name) || 'کڕیاری نەناسراو',
              date: dateStr,
              items: [],
              totalPrice: 0,
              discount: Number(row.discount) || 0
          });
      }
      
      const form = forms.get(row.form_id);
      
      const basePrice = Number(row.selling_price) || 0;
      const discount = Number(row.discount) || 0;
      // We stored the price after discount in the Excel earlier, but here we calculate it directly
      const finalPrice = basePrice - Math.abs(discount);
      const quantity = Number(row.quantity) || 0;
      const itemName = normalizeKurdishText(row.item_name) || 'بێ ناو';
      const lineTotal = finalPrice * quantity;
      
      form.items.push({
          productName: itemName,
          quantity: quantity,
          unitPrice: finalPrice,
          lineTotal: lineTotal
      });
      
      form.totalPrice += lineTotal;
  }

  console.log(`Grouped into ${forms.size} unique sales forms. Starting import to Firestore...`);

  let formCount = 0;
  let batch = db.batch();
  let opsCount = 0;
  
  const commitBatch = async () => {
      if (opsCount > 0) {
          await batch.commit();
          batch = db.batch();
          opsCount = 0;
      }
  };

  // Customers mapping to prevent duplicating customers
  const customersMap = new Map();
  const customersSnapshot = await db.collection('customers').get();
  customersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.customerName) {
          customersMap.set(data.customerName.trim().toLowerCase(), doc.id);
      }
  });

  for (const [formId, form] of forms.entries()) {
      // 1. Handle Customer
      const normalizedCustomerName = form.customer_name;
      const customerKey = normalizedCustomerName.toLowerCase();
      let customerId = customersMap.get(customerKey);
      
      if (!customerId) {
          const newCustomerRef = db.collection('customers').doc();
          customerId = newCustomerRef.id;
          customersMap.set(customerKey, customerId);
          
          batch.set(newCustomerRef, {
              id: customerId,
              customerName: normalizedCustomerName,
              customerPhoneNumber: "",
              customerAddress: "",
              createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          opsCount++;
      }

      // 2. Handle Selling Form
      const sellingFormRef = db.collection('selling_forms').doc();
      const newFormId = sellingFormRef.id;
      
      batch.set(sellingFormRef, {
          id: newFormId,
          formNumber: `SF-EXT-${form.form_id}`, // Prefix with SF-EXT- to indicate historical extraction
          customerName: normalizedCustomerName,
          issueDate: form.date,
          totalPrice: form.totalPrice,
          remainingBalance: 0,
          paymentStatus: 'Fully Paid',
          paymentType: 'Direct Payment',
          discountType: 'cash',
          discountValue: Math.abs(form.discount),
          deliveryCost: 0,
          creatorId: "system-migration",
          creatorName: "System Migration",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      opsCount++;

      // 3. Handle Products
      for (const item of form.items) {
          const productRef = sellingFormRef.collection('selling_form_products').doc();
          // Find dummy product ID
          const productId = makeProductId(item.productName, "", 'Shop Showroom');
          
          batch.set(productRef, {
              id: productRef.id,
              sellingFormId: newFormId,
              productId: productId,
              productName: item.productName,
              sizeModel: "",
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              purchasePrice: 0, // Unused for historical sales
              lineTotal: item.lineTotal,
              category: "Mattress"
          });
          opsCount++;
      }

      // 4. Handle Payment
      const paymentRef = sellingFormRef.collection('payments').doc();
      batch.set(paymentRef, {
          id: paymentRef.id,
          sellingFormId: newFormId,
          paymentDate: form.date,
          amountPaid: form.totalPrice,
          paymentMethod: 'Cash',
          note: 'Historical Data Migration'
      });
      opsCount++;

      formCount++;
      
      if (opsCount >= 400) {
          await commitBatch();
          console.log(`Processed ${formCount} forms...`);
      }
  }

  await commitBatch();
  console.log(`\n✨ Successfully imported all ${formCount} sales forms!`);
  process.exit(0);
}

runImport().catch(e => {
  console.error('❌ Error during import:', e);
  process.exit(1);
});
