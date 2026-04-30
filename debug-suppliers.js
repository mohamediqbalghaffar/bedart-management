const fs = require('fs');
const path = require('path');

const EXPORT_DIR = path.join(__dirname, 'crm_export');

function loadJSON(filename) {
  const filePath = path.join(EXPORT_DIR, filename);
  let raw = fs.readFileSync(filePath, 'utf8');
  raw = raw.replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

const buyingInvoices = loadJSON('buying_invoices.json');
const personal = loadJSON('personal.json');

const personalMap = {};
personal.forEach(p => {
  personalMap[p.ID] = p;
});

const missingSuppliers = new Set();
const invalidTypeSuppliers = new Set();

buyingInvoices.forEach(inv => {
  const supplierId = inv.id_company;
  const supplier = personalMap[supplierId];
  
  if (!supplier) {
    missingSuppliers.add(supplierId);
  } else if (supplier.type_personal !== 1) {
    invalidTypeSuppliers.add({ id: supplierId, name: supplier.name, type: supplier.type_personal });
  }
});

console.log('--- BUYING INVOICES SUPPLIER AUDIT ---');
console.log(`Missing from personal.json: ${Array.from(missingSuppliers).join(', ')}`);
console.log('Wrong type (not type_personal=1):');
invalidTypeSuppliers.forEach(s => {
  console.log(`  ID: ${s.id}, Name: ${s.name}, Type: ${s.type}`);
});
