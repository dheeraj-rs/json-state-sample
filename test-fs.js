const fs = require('fs').promises;
const path = require('path');

async function testWrite() {
  try {
    const publicDir = path.join(__dirname, 'public');
    const testFile = path.join(publicDir, 'fs-test.txt');
    
    // Ensure public directory exists
    try {
      await fs.mkdir(publicDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    // Write test file
    await fs.writeFile(testFile, 'Test content ' + new Date().toISOString());
    console.log('Successfully wrote to:', testFile);
    
    // Verify
    const content = await fs.readFile(testFile, 'utf8');
    console.log('File content:', content);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error path:', error.path);
  }
}

testWrite();
