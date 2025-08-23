import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'test-output.txt');
    const content = `Test write at ${new Date().toISOString()}`;
    
    await writeFile(filePath, content, 'utf8');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'File written successfully',
      path: filePath,
      content
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in simple-test API:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
