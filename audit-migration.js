const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const CRM_PATH = path.join(__dirname, 'crm_export');

async function auditCounts() {
  console.log('--- RUNNING COUNTS AUDIT ---');
  const collections = {
    'customers': 'personal.json',
    'suppliers': 'personal.json',
    'selling_forms': 'selling_invoices.json',
    'buying_forms': 'buying_invoices.json',
    'expenses': 'expenses.json',
    'product_definitions': 'items.json'
  };

  for (const [col, jsonFile] of Object.entries(collections)) {
    const rawJson = fs.readFileSync(path.join(CRM_PATH, jsonFile), 'utf8');
    const jsonData = JSON.parse(rawJson.replace(/^\uFEFF/g, ''));
    let jsonCount = 0;
    
    if (col === 'customers') {
      jsonCount = jsonData.filter(p => p.type_personal === 0).length;
    } else if (col === 'suppliers') {
      jsonCount = jsonData.filter(p => p.type_personal === 1).length;
    } else {
      jsonCount = jsonData.length;
    }

    const snapshot = await db.collection(col).get();
    const firestoreCount = snapshot.size;

    console.log(`${col.padEnd(20)} | JSON: ${jsonCount.toString().padStart(5)} | Firestore: ${firestoreCount.toString().padStart(5)} | ${jsonCount === firestoreCount ? '✅' : '❌'}`);
  }
}

async function auditSellingTotals() {
  console.log('\n--- RUNNING SELLING TOTALS AUDIT ---');
  const sellingInvoices = JSON.parse(fs.readFileSync(path.join(CRM_PATH, 'selling_invoices.json'), 'utf8').replace(/^\uFEFF/g, ''));
  const sellingDetails = JSON.parse(fs.readFileSync(path.join(CRM_PATH, 'selling_details.json'), 'utf8').replace(/^\uFEFF/g, ''));

  let discrepancies = 0;

  for (const invoice of sellingInvoices) {
    const details = sellingDetails.filter(d => d.id_invoice_selling === invoice.ID);
    
    // Theoretical total including item-level discounts
    let theoreticalTotal = details.reduce((sum, d) => {
      let price = parseFloat(d.price_item);
      let qty = parseFloat(d.number_item);
      let discPerc = parseFloat(d.discount_percentage || 0);
      let discMoney = parseFloat(d.discount_money || 0);
      
      let lineTotal = price * qty;
      if (discPerc > 0) lineTotal -= (lineTotal * discPerc / 100);
      if (discMoney > 0) lineTotal -= (discMoney * qty); // Based on code analysis, it seems per item
      
      return sum + lineTotal;
    }, 0);

    // Transport cost
    theoreticalTotal += parseFloat(invoice.transport_price || 0);

    // Global discount
    let globalDisc = parseFloat(invoice.discounts_selling || 0);
    theoreticalTotal -= globalDisc;

    // Check Firestore
    const snapshot = await db.collection('selling_forms').where('_crmId', '==', invoice.ID.toString()).get();
    if (snapshot.empty) {
      console.log(`❌ Invoice ${invoice.ID} (${invoice.invoice_number_selling}) not found in Firestore`);
      discrepancies++;
      continue;
    }

    const fsData = snapshot.docs[0].data();
    const fsTotal = fsData.totalPrice;

    if (Math.abs(theoreticalTotal - fsTotal) > 0.01) {
      console.log(`❌ Invoice ${invoice.ID} | CRM Calc: ${theoreticalTotal.toFixed(2)} | FS: ${fsTotal.toFixed(2)} | Diff: ${(theoreticalTotal - fsTotal).toFixed(2)}`);
      discrepancies++;
    }
  }
  console.log(`Selling Totals Audit Complete. Discrepancies: ${discrepancies}`);
}

async function auditBuyingTotals() {
  console.log('\n--- RUNNING BUYING TOTALS AUDIT ---');
  const buyingInvoices = JSON.parse(fs.readFileSync(path.join(CRM_PATH, 'buying_invoices.json'), 'utf8').replace(/^\uFEFF/g, ''));
  const buyingDetails = JSON.parse(fs.readFileSync(path.join(CRM_PATH, 'buying_details.json'), 'utf8').replace(/^\uFEFF/g, ''));

  let discrepancies = 0;

  for (const invoice of buyingInvoices) {
    const details = buyingDetails.filter(d => d.id_invoice === invoice.ID);
    
    // Theoretical total: sum(qty * price) + customs
    let theoreticalTotal = details.reduce((sum, d) => {
      let price = parseFloat(d.price_buying_one || 0);
      let qty = parseFloat(d.number_item_one || 0);
      return sum + (price * qty);
    }, 0);

    theoreticalTotal += parseFloat(invoice.money_transport || 0); // Customs/Transport

    // Check Firestore
    const snapshot = await db.collection('buying_forms').where('_crmId', '==', invoice.ID.toString()).get();
    if (snapshot.empty) {
      console.log(`❌ Buying Invoice ${invoice.ID} (${invoice.invoice_number}) not found in Firestore`);
      discrepancies++;
      continue;
    }

    const fsData = snapshot.docs[0].data();
    const fsTotal = fsData.totalAmount;

    if (Math.abs(theoreticalTotal - fsTotal) > 0.01) {
      console.log(`❌ Buying Invoice ${invoice.ID} | CRM Calc: ${theoreticalTotal.toFixed(2)} | FS: ${fsTotal.toFixed(2)} | Diff: ${(theoreticalTotal - fsTotal).toFixed(2)}`);
      discrepancies++;
    }
  }
  console.log(`Buying Totals Audit Complete. Discrepancies: ${discrepancies}`);
}

async function runAudit() {
  try {
    await auditCounts();
    await auditSellingTotals();
    await auditBuyingTotals();
  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    process.exit();
  }
}

runAudit();
