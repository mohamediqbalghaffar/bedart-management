/**
 * CRM JSON Files → BedArt Firestore Migration Script
 * 
 * Reads exported JSON files from crm_export/ and writes to Firestore.
 * 
 * Migrates:
 * 1. Items → product_definitions
 * 2. Customers (type_personal=0) → customers
 * 3. Suppliers (type_personal=1) → suppliers
 * 4. Selling Invoices + details → selling_forms + selling_form_products
 * 5. Purchase Invoices + details → buying_forms + buying_form_products
 * 6. Expenses → expenses
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// ── Firebase Admin Init ──
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const EXPORT_DIR = path.join(__dirname, 'crm_export');

// ── Load JSON files ──
function loadJSON(filename) {
  const filePath = path.join(EXPORT_DIR, filename);
  let raw = fs.readFileSync(filePath, 'utf8');
  // Strip UTF-8 BOM if present
  raw = raw.replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

// ── Lookup Maps ──
const moneyTypeMap = { 1: 'IQD', 2: 'USD' };

// Category detection based on Kurdish keywords
function detectCategory(name) {
  if (!name) return 'Mattress';
  const n = name;
  if (n.includes('تەخت') || n.includes('تخت')) return 'Bed';
  if (n.includes('سەرین') || n.includes('بالیف') || n.includes('مخدة') || n.includes('بالشت')) return 'Pillow';
  if (n.includes('بەرگ') || n.includes('مەلەفە') || n.includes('غطاء') || n.includes('لحاف') || n.includes('کەتان')) return 'Cover';
  return 'Mattress';
}

// Format date to YYYY-MM-DD
function formatDate(d) {
  if (!d) return new Date().toISOString().split('T')[0];
  // Handle "YYYY-MM-DD" format already
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const date = new Date(d);
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
}

// ── Batch write helper (respects Firestore 500 ops limit) ──
async function batchWrite(collectionName, docs, idPrefix) {
  const BATCH_SIZE = 50; // Reduced for stability
  let written = 0;
  
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);
    
    for (const docData of chunk) {
      const docId = idPrefix ? `${idPrefix}_${docData._crmId}` : null;
      const ref = docId ? db.collection(collectionName).doc(docId) : db.collection(collectionName).doc();
      batch.set(ref, { ...docData, id: ref.id });
    }
    
    try {
      await batch.commit();
      written += chunk.length;
      console.log(`  ✓ ${collectionName}: ${written}/${docs.length}`);
      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`  ❌ Error committing batch for ${collectionName}:`, err.message);
      throw err;
    }
  }
  
  return written;
}

// ── Main Migration ──
async function migrate() {
  console.log('🚀 Starting CRM → BedArt Firestore migration...\n');
  
  const stats = {};

  try {
    // ═══════════════════════════════════════════════
    // Load all JSON data
    // ═══════════════════════════════════════════════
    console.log('📂 Loading JSON exports...');
    const items = loadJSON('items.json');
    const personal = loadJSON('personal.json');
    const expenses = loadJSON('expenses.json');
    const sellingInvoices = loadJSON('selling_invoices.json');
    const sellingDetails = loadJSON('selling_details.json');
    const buyingInvoices = loadJSON('buying_invoices.json');
    const buyingDetails = loadJSON('buying_details.json');
    
    console.log(`  Items: ${items.length}, Personal: ${personal.length}, Expenses: ${expenses.length}`);
    console.log(`  Selling Invoices: ${sellingInvoices.length}, Selling Details: ${sellingDetails.length}`);
    console.log(`  Buying Invoices: ${buyingInvoices.length}, Buying Details: ${buyingDetails.length}\n`);

    // Build lookup maps
    const itemMap = {};
    for (const row of items) {
      itemMap[row.ID] = { name: row.name, type: row.Item_type, brand: row.brand };
    }
    
    const personalMap = {};
    for (const row of personal) {
      personalMap[row.ID] = row;
    }

    // ═══════════════════════════════════════════════
    // 1. PRODUCT DEFINITIONS
    // ═══════════════════════════════════════════════
    console.log('📦 Migrating product definitions...');
    const productDefs = items.map(row => ({
      productName: (row.name || '').trim(),
      category: detectCategory(row.name),
      sellingPrice: 0,
      _crmId: row.ID.toString(),
      migrationRun: 2,
    }));
    stats.product_definitions = await batchWrite('product_definitions', productDefs, 'product');

    // ═══════════════════════════════════════════════
    // 2. CUSTOMERS (type_personal = 0)
    // ═══════════════════════════════════════════════
    console.log('\n👥 Migrating customers...');
    const customersData = personal
      .filter(row => row.type_personal === 0)
      .map(row => ({
        customerName: (row.name || '').trim(),
        customerPhoneNumber: (row.ph_number || '').trim(),
        customerAddress: (row.address || '').trim(),
        _crmId: row.ID.toString(),
        migrationRun: 2,
      }));
    stats.customers = await batchWrite('customers', customersData, 'customer');

    // ═══════════════════════════════════════════════
    // 3. SUPPLIERS (type_personal = 1)
    // ═══════════════════════════════════════════════
    console.log('\n🏭 Migrating suppliers...');
    const suppliersData = personal
      .filter(row => row.type_personal === 1)
      .map(row => ({
        supplierName: (row.name || '').trim(),
        _crmId: row.ID.toString(),
        migrationRun: 2,
      }));
    stats.suppliers = await batchWrite('suppliers', suppliersData, 'supplier');

    // Build supplier CRM ID → Firestore ID mapping
    const supplierCrmToFirestore = {};
    const suppliersSnap = await db.collection('suppliers').get();
    suppliersSnap.forEach(doc => {
      const data = doc.data();
      if (data._crmId) supplierCrmToFirestore[data._crmId] = doc.id;
    });

    // ═══════════════════════════════════════════════
    // 4. SELLING INVOICES
    // ═══════════════════════════════════════════════
    console.log('\n🧾 Migrating selling invoices...');
    
    // Group selling details by invoice ID (Using id_invoice_selling for link)
    const sellingDetailsMap = {};
    for (const detail of sellingDetails) {
      const invoiceId = detail.id_invoice_selling; 
      if (!sellingDetailsMap[invoiceId]) sellingDetailsMap[invoiceId] = [];
      sellingDetailsMap[invoiceId].push(detail);
    }

    let sellingFormsCount = 0;
    let sellingItemsCount = 0;
    
    // Process in chunks
    for (let i = 0; i < sellingInvoices.length; i += 50) {
      const invoiceChunk = sellingInvoices.slice(i, i + 50);
      
      for (const invoice of invoiceChunk) {
        // Link via invoice.ID
        const details = sellingDetailsMap[invoice.ID] || [];
        const customer = personalMap[invoice.id_seller] || {};
        
        const formRef = db.collection('selling_forms').doc(`selling_form_${invoice.ID}`);
        const batch = db.batch();
        
        let totalPrice = 0;
        
        for (const detail of details) {
          const item = itemMap[detail.id_item] || {};
          const quantity = Number(detail.number_item) || 0;
          const unitPrice = Number(detail.price_item) || 0;
          
          let lineTotal = quantity * unitPrice;
          
          // Apply item-level discounts
          const discPerc = Number(detail.discount_percentage || 0);
          const discMoney = Number(detail.discount_money || 0);
          if (discPerc > 0) lineTotal -= (lineTotal * discPerc / 100);
          if (discMoney > 0) lineTotal -= (discMoney * quantity);
          
          totalPrice += lineTotal;
          
          const itemRef = db.collection(`selling_forms/${formRef.id}/selling_form_products`).doc(`selling_form_product_${detail.ID}`);
          batch.set(itemRef, {
            id: itemRef.id,
            sellingFormId: formRef.id,
            productId: '',
            productName: (item.name || 'Unknown Item').trim(),
            quantity,
            unitPrice,
            lineTotal: Number(lineTotal.toFixed(2)),
            category: detectCategory(item.name),
          });
          sellingItemsCount++;
        }

        // Add transport price
        const transportPrice = Number(invoice.transport_price || 0);
        totalPrice += transportPrice;

        // Subtract global discount
        const globalDiscount = Number(invoice.discounts_selling || 0);
        totalPrice -= globalDiscount;

        const formData = {
          id: formRef.id,
          formNumber: String(invoice.invoice_number_selling || invoice.ID),
          customerName: (customer.name || 'Unknown').trim(),
          customerPhoneNumber: (customer.ph_number || '').trim(),
          customerAddress: (customer.address || '').trim(),
          issueDate: formatDate(invoice.invoice_date_selling),
          paymentType: 'Direct Payment',
          paymentStatus: 'Fully Paid',
          totalPrice: Number(totalPrice.toFixed(2)),
          remainingBalance: 0,
          discountValue: globalDiscount,
          deliveryCost: transportPrice,
          creatorName: 'CRM Import',
          creatorId: 'crm-import',
          _crmId: invoice.ID.toString(),
          migrationRun: 2,
        };

        batch.set(formRef, formData);

        await batch.commit();
        sellingFormsCount++;
        if (details.length === 0) {
          console.warn(`  ⚠️ selling_form ${invoice.ID} (No. ${invoice.invoice_number_selling}) has 0 items!`);
        }
      }
      
      console.log(`  ✓ selling_forms: ${sellingFormsCount}/${sellingInvoices.length} (items: ${sellingItemsCount})`);
    }
    
    stats.selling_forms = sellingFormsCount;
    stats.selling_form_products = sellingItemsCount;

    // ═══════════════════════════════════════════════
    // 5. PURCHASE INVOICES
    // ═══════════════════════════════════════════════
    console.log('\n🛒 Migrating purchase invoices...');
    
    const buyingDetailsMap = {};
    for (const detail of buyingDetails) {
      const invoiceId = detail.id_invoice;
      if (!buyingDetailsMap[invoiceId]) buyingDetailsMap[invoiceId] = [];
      buyingDetailsMap[invoiceId].push(detail);
    }

    let buyingFormsCount = 0;
    let buyingItemsCount = 0;
    
    for (const invoice of buyingInvoices) {
      // Use invoice_number to match details (Verified mapping)
      const details = buyingDetailsMap[invoice.invoice_number] || [];
      const supplierId = supplierCrmToFirestore[invoice.id_company] || '';
      
      const formRef = db.collection('buying_forms').doc(`buying_form_${invoice.ID}`);
      const batch = db.batch();
      
      let totalAmount = 0;
      
      for (const detail of details) {
        const item = itemMap[detail.id_item] || {};
        const quantity = Number(detail.number_item_one) || 0;
        const unitPrice = Number(detail.price_buying_one) || 0;
        const lineTotal = quantity * unitPrice;
        totalAmount += lineTotal;
        
        const itemRef = db.collection(`buying_forms/${formRef.id}/buying_form_products`).doc(`buying_form_product_${detail.ID}`);
        batch.set(itemRef, {
          id: itemRef.id,
          buyingFormId: formRef.id,
          productId: '',
          productName: (item.name || 'Unknown Item').trim(),
          quantity,
          unitPrice,
          sellingPrice: Number(detail.sales_one) || 0,
          category: detectCategory(item.name),
          sizeModel: '',
          lineTotal: Number(lineTotal.toFixed(2)),
        });
        buyingItemsCount++;
      }

      const customsFee = Number(invoice.money_transport || 0);
      totalAmount += customsFee;

      batch.set(formRef, {
        id: formRef.id,
        supplierId: supplierId,
        issueDate: formatDate(invoice.invoice_date),
        stockLocation: 'Warehouse',
        totalAmount: Number(totalAmount.toFixed(2)),
        customsFee: customsFee,
        _crmId: invoice.ID.toString(),
        migrationRun: 2,
      });

      await batch.commit();
      buyingFormsCount++;
    }
    
    console.log(`  ✓ buying_forms: ${buyingFormsCount}/${buyingInvoices.length} (items: ${buyingItemsCount})`);
    stats.buying_forms = buyingFormsCount;
    stats.buying_form_products = buyingItemsCount;

    // ═══════════════════════════════════════════════
    // 6. EXPENSES
    // ═══════════════════════════════════════════════
    console.log('\n💰 Migrating expenses...');
    const expensesData = expenses.map(row => ({
      name: (row.expense_type || '').trim(),
      note: (row.expense_detail || '').trim(),
      amount: Number(row.expense_price) || 0,
      currency: moneyTypeMap[row.money_type] || 'IQD',
      category: 'Other',
      date: formatDate(row.date_time),
      _crmId: row.ID.toString(),
      migrationRun: 2,
    }));
    stats.expenses = await batchWrite('expenses', expensesData, 'expense');

    // ═══════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════
    console.log('\n' + '═'.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('═'.repeat(50));
    for (const [key, value] of Object.entries(stats)) {
      console.log(`  ${key}: ${value} records`);
    }
    console.log('═'.repeat(50));
    console.log('✅ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    process.exit(0);
  }
}

migrate().catch(console.error);
