import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'app-state.json');
  
  try {
    // Try to write a test file
    const testContent = JSON.stringify({ test: 'permission_test' });
    await fs.writeFile(filePath, testContent, 'utf8');
    
    // Verify we can read it back
    await fs.access(filePath);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'File system is writable',
      path: filePath
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'File system error',
      error: error.message,
      code: error.code,
      path: filePath
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
