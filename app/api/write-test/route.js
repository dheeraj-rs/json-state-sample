import { writeFile, mkdir, access, constants } from 'fs/promises';
import { join, dirname } from 'path';

export async function GET() {
  try {
    // Define file path
    const publicDir = join(process.cwd(), 'public');
    const filePath = join(publicDir, 'test-write.txt');
    const content = `Test write at ${new Date().toISOString()}`;
    
    // Ensure public directory exists
    try {
      await access(publicDir, constants.W_OK);
    } catch (dirError) {
      console.log('Public directory does not exist or is not writable, creating...');
      await mkdir(publicDir, { recursive: true, mode: 0o755 });
    }
    
    // Write file with explicit permissions
    await writeFile(filePath, content, { 
      encoding: 'utf8',
      mode: 0o644 
    });
    
    // Verify file was written
    try {
      await access(filePath, constants.R_OK);
    } catch (fileError) {
      console.error('Failed to verify file was written:', fileError);
      throw new Error(`File write verification failed: ${fileError.message}`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'File written successfully',
      path: filePath,
      content,
      cwd: process.cwd(),
      filesInPublic: (await import('fs')).readdirSync(publicDir)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in write-test API:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      cwd: process.cwd(),
      filesInCwd: (await import('fs')).readdirSync(process.cwd())
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
