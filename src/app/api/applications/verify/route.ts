import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    // Get all documents
    const allDocs = await collection.find({}).toArray();
    console.log('All documents:', allDocs);

    // Get document count
    const count = await collection.countDocuments();
    console.log('Total documents:', count);

    return NextResponse.json({
      totalDocuments: count,
      documents: allDocs
    });
  } catch (error) {
    console.error('Error verifying applications:', error);
    return new NextResponse('Error verifying applications', { status: 500 });
  }
} 