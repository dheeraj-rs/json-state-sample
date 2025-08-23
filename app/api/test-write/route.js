import { promises as fs } from 'fs';
import path from 'path';

export async function POST() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const testFilePath = path.join(publicDir, 'test-write.txt');
    const testContent = `Test write at ${new Date().toISOString()}`;
    
    // Test writing
    await fs.writeFile(testFilePath, testContent, 'utf8');
    
    // Test reading
    const content = await fs.readFile(testFilePath, 'utf8');
    
    // Test updating
    const updateContent = `Updated at ${new Date().toISOString()}`;
    await fs.writeFile(testFilePath, updateContent, 'utf8');
    
    // Verify
    const updatedContent = await fs.readFile(testFilePath, 'utf8');
    
    return new Response(JSON.stringify({
      success: true,
      initialWrite: content === testContent,
      updateWrite: updatedContent === updateContent,
      testFilePath,
      fileExists: true,
      content: updatedContent
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
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
