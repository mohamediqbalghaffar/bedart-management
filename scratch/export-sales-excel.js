const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const jsonPath = 'C:\\Users\\Click\\.gemini\\antigravity\\scratch\\all_sales.json';
const outputDir = path.join(process.env.USERPROFILE, 'Desktop', 'the sales extracted files');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Read JSON data
const rawData = fs.readFileSync(jsonPath, 'utf-8');
const data = JSON.parse(rawData.replace(/^\uFEFF/, ''));

// Group by form_id
const forms = {};

data.forEach(row => {
    if (!row.form_id) return;
    
    if (!forms[row.form_id]) {
        forms[row.form_id] = {
            form_id: row.form_id,
            customer_name: row.customer_name ? row.customer_name.trim() : 'کڕیاری نەناسراو',
            items: []
        };
    }
    
    const basePrice = Number(row.selling_price) || 0;
    const discount = Number(row.discount) || 0;
    // Calculate price after discount: assuming discount always reduces price, whether entered as positive or negative.
    const priceAfterDiscount = basePrice - Math.abs(discount);
    
    forms[row.form_id].items.push({
        'ناو': row.item_name || 'بێ ناو',
        'نرخی فرۆشتن': priceAfterDiscount,
        'دانە': Number(row.quantity) || 0
    });
});

// Sanitize filename
function sanitize(name) {
    return name.replace(/[<>:"/\\|?*]+/g, '').trim();
}

let count = 0;

for (const formId in forms) {
    const form = forms[formId];
    
    // Name excel by customer name, appending form_id to ensure uniqueness
    const safeCustomerName = sanitize(form.customer_name) || 'Unknown';
    const fileName = `${safeCustomerName} - ${form.form_id}.xlsx`;
    const filePath = path.join(outputDir, fileName);
    
    // Create worksheet
    const ws = xlsx.utils.json_to_sheet(form.items);
    
    // Set RTL and column widths
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ rightToLeft: true });
    
    ws['!cols'] = [
        { wch: 40 }, // ناو
        { wch: 20 }, // نرخ دوای داشکاندن
        { wch: 10 }  // دانە
    ];
    
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'پسوڵە');
    
    xlsx.writeFile(wb, filePath);
    count++;
}

console.log(`Successfully extracted ${count} sales forms to: ${outputDir}`);
