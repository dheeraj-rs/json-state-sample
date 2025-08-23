const fs = require('fs').promises;
const path = require('path');

async function testWrite() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, 'test-file.txt');
    
    console.log('Writing to:', filePath);
    await fs.writeFile(filePath, 'Test content ' + new Date().toISOString());
    
    const content = await fs.readFile(filePath, 'utf8');
    console.log('File content:', content);
    
    console.log('Test successful!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWrite();
