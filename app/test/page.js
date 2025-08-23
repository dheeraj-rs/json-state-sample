'use client';

export default function TestPage() {
  const testWrite = async () => {
    try {
      const response = await fetch('/api/write-test', { method: 'GET' });
      const result = await response.json();
      console.log('Test write result:', result);
      alert(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Test write failed:', error);
      alert('Test failed: ' + error.message);
    }
  };

  const testSaveState = async () => {
    try {
      const response = await fetch('/api/save-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'value', timestamp: new Date().toISOString() })
      });
      const result = await response.json();
      console.log('Save state result:', result);
      alert(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Save state failed:', error);
      alert('Save state failed: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>API Test Page</h1>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button 
          onClick={testWrite}
          style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Test Write
        </button>
        <button 
          onClick={testSaveState}
          style={{
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Test Save State
        </button>
      </div>
    </div>
  );
}
