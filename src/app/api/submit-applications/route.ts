import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { encryptData } from '@/app/lib/encryption';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collections = await db.listCollections().toArray();
    const applicationsCollection = collections.find(c => c.name === 'applications');

    if (!applicationsCollection) {
      return NextResponse.json({ error: 'Applications collection not found' }, { status: 404 });
    }

    const collection = db.collection('applications');

    // Encrypt sensitive data
    const encryptedData = data.map((app: any) => ({
      ...app,
      ssn: app.ssn ? encryptData(app.ssn) : null,
      dateOfBirth: app.dateOfBirth ? encryptData(app.dateOfBirth) : null
    }));

    const result = await collection.insertMany(encryptedData);
    const count = await collection.countDocuments();

    return NextResponse.json({
      success: true,
      insertedCount: result.insertedCount,
      totalDocuments: count
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit applications' },
      { status: 500 }
    );
  }
} 