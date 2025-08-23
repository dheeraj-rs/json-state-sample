const fs = require('fs').promises;
const path = require('path');

export async function POST(request) {
  try {
    console.log('Save state request received');
    
    // Parse request body
    const body = await request.json();
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, 'app-state.json');
    
    console.log('Saving to:', filePath);
    
    // Ensure public directory exists
    try {
      await fs.mkdir(publicDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error('Error creating public directory:', err);
        throw err;
      }
    }
    
    // Write to file
    const data = JSON.stringify(body, null, 2);
    await fs.writeFile(filePath, data, 'utf8');
    
    console.log('State saved successfully');
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'State saved successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in save-state:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to save state',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
