const fs = require('fs').promises;
const path = require('path');

export async function POST(request) {
  try {
    const body = await request.json();
    await fs.mkdir('public', { recursive: true });
    await fs.writeFile('public/app-state.json', JSON.stringify(body, null, 2));

    return Response.json({ success: true, message: 'State saved' });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
