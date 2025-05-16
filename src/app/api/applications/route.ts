import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { Document, WithId } from 'mongodb';
import { decryptData } from '@/app/lib/encryption';

interface Application extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: string;
  site: string;
  lcgmsCode: string;
  geographicDistrict: string;
  workPreferences?: {
    bronx: boolean;
    brooklyn: boolean;
    queens: boolean;
    statenIsland: boolean;
    manhattan: boolean;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    weekend: boolean;
  };
  fingerprintQuestionnaire: boolean;
  documentsVerified: boolean;
  attendanceVerified: boolean;
  status: string;
  submittedAt: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    console.log('Fetching applications with params:', { page, limit, skip });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection<Application>('applications');

    // First, let's check if we can get the total count
    const total = await collection.countDocuments();
    console.log('Total documents in collection:', total);

    // Then fetch the applications
    const applications = await collection
      .find({})
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('Fetched applications:', applications.length);

    // Decrypt sensitive data
    const decryptedApplications = applications.map(app => {
      try {
        return {
          ...app,
          ssn: app.ssn ? decryptData(app.ssn) : null,
          dateOfBirth: app.dateOfBirth ? decryptData(app.dateOfBirth) : null,
        };
      } catch (error) {
        console.error('Error decrypting application:', app._id, error);
        return app;
      }
    });

    console.log('Decrypted applications:', decryptedApplications.length);

    return NextResponse.json({
      applications: decryptedApplications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return new NextResponse('Error fetching applications', { status: 500 });
  }
} 