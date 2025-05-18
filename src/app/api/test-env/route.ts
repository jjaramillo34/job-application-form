import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
    encryptionKeyLength: process.env.ENCRYPTION_KEY?.length,
    nodeEnv: process.env.NODE_ENV,
  });
} 