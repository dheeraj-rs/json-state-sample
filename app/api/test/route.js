import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const testFile = path.join(publicDir, 'test.txt');
    
    // Simple write test
    await fs.writeFile(testFile, 'test', 'utf8');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test file written successfully',
      path: testFile
    }));
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), { status: 500 });
  }
}
