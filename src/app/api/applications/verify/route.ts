import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    const allDocs = await collection.find({}).toArray();
    const count = await collection.countDocuments();

    return NextResponse.json({
      success: true,
      totalDocuments: count,
      documents: allDocs
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify applications' },
      { status: 500 }
    );
  }
} 