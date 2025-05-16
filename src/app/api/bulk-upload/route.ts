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
      // Convert work preferences to boolean values
      const workPreferences = {
        bronx: record.bronx?.toLowerCase() === 'true' || record.bronx?.toLowerCase() === 'yes',
        brooklyn: record.brooklyn?.toLowerCase() === 'true' || record.brooklyn?.toLowerCase() === 'yes',
        queens: record.queens?.toLowerCase() === 'true' || record.queens?.toLowerCase() === 'yes',
        statenIsland: record.statenIsland?.toLowerCase() === 'true' || record.statenIsland?.toLowerCase() === 'yes',
        manhattan: record.manhattan?.toLowerCase() === 'true' || record.manhattan?.toLowerCase() === 'yes',
        morning: record.morning?.toLowerCase() === 'true' || record.morning?.toLowerCase() === 'yes',
        afternoon: record.afternoon?.toLowerCase() === 'true' || record.afternoon?.toLowerCase() === 'yes',
        evening: record.evening?.toLowerCase() === 'true' || record.evening?.toLowerCase() === 'yes',
        weekend: record.weekend?.toLowerCase() === 'true' || record.weekend?.toLowerCase() === 'yes'
      };

      // Convert verification fields to boolean values
      const fingerprintQuestionnaire = record.fingerprintQuestionnaire?.toLowerCase() === 'true' || record.fingerprintQuestionnaire?.toLowerCase() === 'yes';
      const documentsVerified = record.documentsVerified?.toLowerCase() === 'true' || record.documentsVerified?.toLowerCase() === 'yes';
      const attendanceVerified = record.attendanceVerified?.toLowerCase() === 'true' || record.attendanceVerified?.toLowerCase() === 'yes';

      // Encrypt sensitive data
      const encryptedSsn = encryptData(record.ssn);
      const encryptedDob = encryptData(record.dateOfBirth);

      return {
        firstName: record.firstName,
        lastName: record.lastName,
        address: record.address,
        city: record.city,
        state: record.state,
        zipCode: record.zipCode,
        phone: record.phone,
        email: record.email,
        ssn: encryptedSsn,
        dateOfBirth: encryptedDob,
        program: record.program,
        site: record.site,
        lcgmsCode: record.lcgmsCode,
        geographicDistrict: record.geographicDistrict,
        workPreferences,
        fingerprintQuestionnaire,
        documentsVerified,
        attendanceVerified,
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