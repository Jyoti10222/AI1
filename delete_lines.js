const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\r\n'); // Handle Windows CRLF

// Line 640 is index 639
const startLine = 640;
const endLine = 809;
const startIndex = startLine - 1;
const count = endLine - startLine + 1;

console.log(`Deleting ${count} lines starting from line ${startLine}`);
console.log(`First line to delete: ${lines[startIndex]}`);
console.log(`Last line to delete: ${lines[startIndex + count - 1]}`);

lines.splice(startIndex, count);

fs.writeFileSync(filePath, lines.join('\r\n'));
console.log('Done.');
