const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\Click\\Desktop\\the 36 extracted files\\11.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('First 10 rows:');
    console.log(JSON.stringify(data.slice(0, 10), null, 2));
} catch (error) {
    console.error('Error reading file:', error);
}
