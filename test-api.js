const http = require('http');

// Test the write-test endpoint
const testWriteTest = async () => {
  return new Promise((resolve) => {
    const req = http.request(
      'http://localhost:3000/api/write-test',
      { method: 'GET' },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log('Response status:', res.statusCode);
          console.log('Response headers:', res.headers);
          console.log('Response body:', data);
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        });
      }
    );
    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve({ error });
    });
    req.end();
  });
};

// Test the save-state endpoint
const testSaveState = async () => {
  const postData = JSON.stringify({
    test: 'test data',
    timestamp: new Date().toISOString()
  });

  return new Promise((resolve) => {
    const req = http.request(
      'http://localhost:3000/api/save-state',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log('Save State Response status:', res.statusCode);
          console.log('Save State Response headers:', res.headers);
          console.log('Save State Response body:', data);
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        });
      }
    );
    
    req.on('error', (error) => {
      console.error('Save State Request error:', error);
      resolve({ error });
    });
    
    req.write(postData);
    req.end();
  });
};

// Run tests
const runTests = async () => {
  console.log('=== Testing /api/write-test ===');
  await testWriteTest();
  
  console.log('\n=== Testing /api/save-state ===');
  await testSaveState();
};

runTests().catch(console.error);
