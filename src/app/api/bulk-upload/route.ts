import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { parse } from 'csv-parse/sync';
import { encryptData } from '@/app/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read and parse CSV file
    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No records found in CSV file' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('applications');

    // Process and insert records
    const processedRecords = records.map((record: any) => {
      // Convert work preferences to boolean values and structure as an object
      const workPreferences = {
        bronx: record.bronx?.toLowerCase() === 'true' || record.bronx?.toLowerCase() === 'yes' || false,
        brooklyn: record.brooklyn?.toLowerCase() === 'true' || record.brooklyn?.toLowerCase() === 'yes' || false,
        queens: record.queens?.toLowerCase() === 'true' || record.queens?.toLowerCase() === 'yes' || false,
        statenIsland: record.statenIsland?.toLowerCase() === 'true' || record.statenIsland?.toLowerCase() === 'yes' || false,
        manhattan: record.manhattan?.toLowerCase() === 'true' || record.manhattan?.toLowerCase() === 'yes' || false,
        morning: record.morning?.toLowerCase() === 'true' || record.morning?.toLowerCase() === 'yes' || false,
        afternoon: record.afternoon?.toLowerCase() === 'true' || record.afternoon?.toLowerCase() === 'yes' || false,
        evening: record.evening?.toLowerCase() === 'true' || record.evening?.toLowerCase() === 'yes' || false,
        weekend: record.weekend?.toLowerCase() === 'true' || record.weekend?.toLowerCase() === 'yes' || false
      };

      // Convert verification fields to boolean values
      const fingerprintQuestionnaire = record.fingerprintQuestionnaire?.toLowerCase() === 'true' || record.fingerprintQuestionnaire?.toLowerCase() === 'yes' || false;
      const documentsVerified = record.documentsVerified?.toLowerCase() === 'true' || record.documentsVerified?.toLowerCase() === 'yes' || false;
      const attendanceVerified = record.attendanceVerified?.toLowerCase() === 'true' || record.attendanceVerified?.toLowerCase() === 'yes' || false;

      // Encrypt sensitive data
      const encryptedSsn = record.ssn ? encryptData(record.ssn) : null;
      const encryptedDob = record.dateOfBirth ? encryptData(record.dateOfBirth) : null;

      // Create the application object with workPreferences as a nested object
      return {
        firstName: record.firstName,
        lastName: record.lastName,
        address: record.address,
        city: record.city,
        state: record.state,
        zipCode: record.zipCode,
        phone: record.phone,
        email: record.email,
        counselor_email: record.counselor_email,
        ssn: encryptedSsn,
        dateOfBirth: encryptedDob,
        program: record.program,
        site: record.site,
        lcgmsCode: record.lcgmsCode,
        geographicDistrict: record.geographicDistrict,
        workPreferences, // This is now a nested object
        fingerprintQuestionnaire,
        documentsVerified,
        attendanceVerified,
        fingerprintPaymentPreference: record.fingerprintPaymentPreference || 'pending',
        status: 'pending',
        submittedAt: new Date()
      };
    });

    // Insert records into database
    const result = await collection.insertMany(processedRecords);

    return NextResponse.json({
      message: `Successfully uploaded ${result.insertedCount} applications`,
      insertedCount: result.insertedCount
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    );
  }
} 