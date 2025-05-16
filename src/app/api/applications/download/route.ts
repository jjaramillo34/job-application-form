import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { createObjectCsvWriter } from 'csv-writer';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { decryptData } from '@/app/lib/encryption';
import { Document, WithId } from 'mongodb';

interface Application extends Document {
  // object id
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  counselor_email: string;
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
  ssn: string;
  dateOfBirth: string;
  coupon?: {
    _id: string;
    coupon_code: string;
    assigned_at: string;
  };
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Verify password (you can implement your own password verification logic)
    if (password !== process.env.DOWNLOAD_PASSWORD) {
      return new NextResponse('Invalid password', { status: 401 });
    }

    const client = await clientPromise;
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    console.log('MongoDB DB:', process.env.MONGODB_DB);
    
    const db = client.db(process.env.MONGODB_DB);
    
    // List all collections to verify we're in the right database
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    const collection = db.collection<Application>('applications');
    
    // Get total count first
    const totalCount = await collection.countDocuments();
    console.log('Total documents in collection:', totalCount);

    // Get all applications
    const applications = await collection.find({}).toArray();
    console.log('Found applications for download:', applications.length);

    // Get all coupons
    const coupons = await db.collection('coupons').find({}).toArray();
    
    // Create a map of student IDs to their coupons
    const couponMap = new Map(
      coupons.map(coupon => [coupon.assigned_to, coupon])
    );

    if (applications.length === 0) {
      return new NextResponse('No applications found', { status: 404 });
    }

    // Create a temporary file path
    const tempFilePath = join(process.cwd(), 'temp', `applications-${Date.now()}.csv`);

    // Process and decrypt sensitive data, and add coupon information
    const processedApplications = applications.map((app: WithId<Application>) => {
      try {
        const decryptedSSN = app.ssn ? decryptData(app.ssn) : '';
        const decryptedDOB = app.dateOfBirth ? decryptData(app.dateOfBirth) : '';
        const studentCoupon = couponMap.get(app._id.toString());

        return {
          ...app,
          ssn: decryptedSSN,
          dateOfBirth: decryptedDOB,
          bronx: app.workPreferences?.bronx || false,
          brooklyn: app.workPreferences?.brooklyn || false,
          queens: app.workPreferences?.queens || false,
          statenIsland: app.workPreferences?.statenIsland || false,
          manhattan: app.workPreferences?.manhattan || false,
          morning: app.workPreferences?.morning || false,
          afternoon: app.workPreferences?.afternoon || false,
          evening: app.workPreferences?.evening || false,
          weekend: app.workPreferences?.weekend || false,
          coupon_code: studentCoupon?.coupon_code || '',
          coupon_assigned_at: studentCoupon?.assigned_at || ''
        };
      } catch (error) {
        console.error('Error processing application:', app._id, error);
        return app;
      }
    });

    console.log('Processed applications for CSV:', processedApplications.length);

    // Create CSV content manually
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Counselor Email',
      'Phone',
      'Program',
      'Site',
      'LCGMS Code',
      'Geographic District',
      'SSN',
      'Date of Birth',
      'Bronx',
      'Brooklyn',
      'Queens',
      'Staten Island',
      'Manhattan',
      'Morning',
      'Afternoon',
      'Evening',
      'Weekend',
      'Fingerprint Questionnaire',
      'Documents Verified',
      'Attendance Verified',
      'Status',
      'Submitted At',
      'Coupon Code',
      'Coupon Assigned At'
    ].join(',');

    const rows = processedApplications.map(app => [
      app._id,
      app.firstName,
      app.lastName,
      app.email,
      app.counselor_email,
      app.phone,
      app.program,
      app.site,
      app.lcgmsCode,
      app.geographicDistrict,
      app.ssn,
      app.dateOfBirth,
      app.bronx,
      app.brooklyn,
      app.queens,
      app.statenIsland,
      app.manhattan,
      app.morning,
      app.afternoon,
      app.evening,
      app.weekend,
      app.fingerprintQuestionnaire,
      app.documentsVerified,
      app.attendanceVerified,
      app.status,
      app.submittedAt,
      app.coupon_code,
      app.coupon_assigned_at
    ].map(field => `"${field}"`).join(','));

    const csvContent = [headers, ...rows].join('\n');
    console.log('CSV content length:', csvContent.length);

    // Write the CSV file
    writeFileSync(tempFilePath, csvContent, 'utf8');
    console.log('CSV file written to:', tempFilePath);

    // Read the file
    const fileBuffer = readFileSync(tempFilePath);
    console.log('File buffer created, size:', fileBuffer.length);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error downloading applications:', error);
    return new NextResponse('Error downloading applications', { status: 500 });
  }
} 