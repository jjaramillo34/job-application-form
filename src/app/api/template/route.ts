import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'templates', 'bulk-upload-template.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="bulk-upload-template.csv"',
      },
    });
  } catch (error) {
    console.error('Error serving template:', error);
    return NextResponse.json(
      { error: 'Failed to serve template' },
      { status: 500 }
    );
  }
} 