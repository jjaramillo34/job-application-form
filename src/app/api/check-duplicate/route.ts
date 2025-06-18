import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, ssn } = await request.json();

    if (!email || !ssn) {
      return NextResponse.json(
        { error: 'Email and SSN are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    // Check for existing application with same email or SSN
    const existingApplication = await collection.findOne({
      $or: [
        { email: email.toLowerCase() },
        { ssn: ssn }
      ]
    });

    return NextResponse.json({
      isDuplicate: !!existingApplication
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
} 