import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { createObjectCsvWriter } from 'csv-writer';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { decryptData } from '@/app/lib/encryption';
import { Document, WithId } from 'mongodb';
import { format } from 'date-fns';

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
  address: string;
  city: string;
  state: string;
  zipCode: string;
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
  fingerprintPaymentPreference: string;
  coupon?: {
    _id: string;
    coupon_code: string;
    assigned_at: string;
  };
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.DOWNLOAD_PASSWORD;

    if (!password || password !== correctPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collections = await db.listCollections().toArray();
    const applicationsCollection = collections.find(c => c.name === 'applications');

    if (!applicationsCollection) {
      return NextResponse.json({ error: 'Applications collection not found' }, { status: 404 });
    }

    const collection = db.collection('applications');
    const totalCount = await collection.countDocuments();
    const applications = await collection.find({}).toArray();

    // Fetch all coupons
    const couponsCollection = db.collection('coupons');
    const coupons = await couponsCollection.find({}).toArray();

    // Create a map of student IDs to their coupons
    const couponMap = new Map(
      coupons.map(coupon => [coupon.assigned_to, coupon])
    );

    // Process applications for CSV
    const processedApplications = applications.map(app => {
      const workPreferences = app.workPreferences || {};
      const locations = [
        workPreferences.bronx ? 'Bronx' : '',
        workPreferences.brooklyn ? 'Brooklyn' : '',
        workPreferences.queens ? 'Queens' : '',
        workPreferences.statenIsland ? 'Staten Island' : '',
        workPreferences.manhattan ? 'Manhattan' : ''
      ].filter(Boolean).join(', ');

      const times = [
        workPreferences.morning ? 'Morning' : '',
        workPreferences.afternoon ? 'Afternoon' : '',
        workPreferences.evening ? 'Evening' : '',
        workPreferences.weekend ? 'Weekend' : ''
      ].filter(Boolean).join(', ');

      // Decrypt sensitive data
      const decryptedSSN = app.ssn ? decryptData(app.ssn) : '';
      const decryptedDOB = app.dateOfBirth ? decryptData(app.dateOfBirth) : '';

      // Get coupon information
      const studentCoupon = couponMap.get(app._id.toString());

      return {
        'ID': app._id.toString(),
        'First Name': app.firstName || '',
        'Last Name': app.lastName || '',
        'Email': app.email || '',
        'Phone': app.phone || '',
        'Address': app.address || '',
        'City': app.city || '',
        'State': app.state || '',
        'Zip Code': app.zipCode || '',
        'Program': app.program || '',
        'Site': app.site || '',
        'LCGMS Code': app.lcgmsCode || '',
        'Geographic District': app.geographicDistrict || '',
        'Work Locations': locations,
        'Work Times': times,
        'SSN': decryptedSSN,
        'Date of Birth': decryptedDOB,
        'Fingerprint Questionnaire': app.fingerprintQuestionnaire ? 'Yes' : 'No',
        'Documents Verified': app.documentsVerified ? 'Yes' : 'No',
        'Attendance Verified': app.attendanceVerified ? 'Yes' : 'No',
        'Fingerprint Payment': app.fingerprintPaymentPreference || '',
        'Status': app.status || 'pending',
        'Submitted At': app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '',
        'Counselor Email': app.counselor_email || '',
        'Coupon Code': studentCoupon?.coupon_code || '',
        'Coupon Assigned At': studentCoupon?.assigned_at ? new Date(studentCoupon.assigned_at).toLocaleString() : ''
      };
    });

    // Convert to CSV
    const csvContent = [
      Object.keys(processedApplications[0]).join(','),
      ...processedApplications.map(app => 
        Object.values(app).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const fileBuffer = Buffer.from(csvContent);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="applications-${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to download applications' },
      { status: 500 }
    );
  }
} 