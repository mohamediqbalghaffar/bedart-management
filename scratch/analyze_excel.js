const xlsx = require('xlsx');
const fs = require('fs');

const filePath = 'C:/Users/Click/Desktop/Expenses_752_Records.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log(`Total rows: ${data.length}`);
if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    
    // Check if there is a column for categories/types and tally them
    const columnNames = Object.keys(data[0]);
    
    for (const col of columnNames) {
        const counts = {};
        for (const row of data) {
            const val = row[col];
            counts[val] = (counts[val] || 0) + 1;
        }
        
        const uniqueVals = Object.keys(counts).length;
        if (uniqueVals < 20) {
            console.log(`\nValue counts for column '${col}':`);
            console.log(counts);
        }
    }
}
