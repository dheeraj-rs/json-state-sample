import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'app-state.json');
    
    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Write the file with pretty-printed JSON
    const data = JSON.stringify(req.body, null, 2);
    await fs.writeFile(filePath, data, 'utf8');
    
    // Verify the file was written
    const fileContent = await fs.readFile(filePath, 'utf8');
    if (JSON.stringify(JSON.parse(fileContent)) !== JSON.stringify(req.body)) {
      throw new Error('File content does not match the expected state');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving state:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to save state',
      error: error.message 
    });
  }
}
