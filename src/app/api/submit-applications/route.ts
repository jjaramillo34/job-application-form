import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { encryptData } from '@/app/lib/encryption';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received bulk data:', data);

    if (!Array.isArray(data)) {
      return new NextResponse('Invalid data format', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    // Verify the collection exists
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Process and encrypt each application
    const applications = data.map(app => ({
      ...app,
      ssn: encryptData(app.ssn),
      dateOfBirth: encryptData(app.dateOfBirth),
      submittedAt: new Date().toISOString(),
      status: 'pending'
    }));

    console.log('Encrypted data prepared for insertion');

    // Insert all applications
    const result = await collection.insertMany(applications);
    console.log('Insert result:', result);

    // Verify the documents were inserted
    const count = await collection.countDocuments();
    console.log('Total documents after insertion:', count);

    return NextResponse.json({ 
      success: true, 
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds 
    });
  } catch (error) {
    console.error('Error submitting applications:', error);
    return new NextResponse('Error submitting applications', { status: 500 });
  }
} 