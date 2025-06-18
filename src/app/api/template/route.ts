import { NextResponse } from 'next/server';
import { createObjectCsvWriter } from 'csv-writer';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export async function GET() {
  try {
    const tempFilePath = join(tmpdir(), 'template.csv');

    const csvWriter = createObjectCsvWriter({
      path: tempFilePath,
      header: [
        { id: 'firstName', title: 'firstName' },
        { id: 'lastName', title: 'lastName' },
        { id: 'email', title: 'email' },
        { id: 'counselor_email', title: 'counselor_email' },
        { id: 'phone', title: 'phone' },
        { id: 'address', title: 'address' },
        { id: 'city', title: 'city' },
        { id: 'state', title: 'state' },
        { id: 'zipCode', title: 'zipCode' },
        { id: 'ssn', title: 'ssn' },
        { id: 'dateOfBirth', title: 'dateOfBirth' },
        { id: 'program', title: 'program' },
        { id: 'site', title: 'site' },
        { id: 'lcgmsCode', title: 'lcgmsCode' },
        { id: 'geographicDistrict', title: 'geographicDistrict' },
        { id: 'bronx', title: 'bronx' },
        { id: 'brooklyn', title: 'brooklyn' },
        { id: 'queens', title: 'queens' },
        { id: 'statenIsland', title: 'statenIsland' },
        { id: 'manhattan', title: 'manhattan' },
        { id: 'morning', title: 'morning' },
        { id: 'afternoon', title: 'afternoon' },
        { id: 'evening', title: 'evening' },
        { id: 'weekend', title: 'weekend' },
        { id: 'fingerprintQuestionnaire', title: 'fingerprintQuestionnaire' },
        { id: 'documentsVerified', title: 'documentsVerified' },
        { id: 'attendanceVerified', title: 'attendanceVerified' },
        { id: 'fingerprintPaymentPreference', title: 'fingerprintPaymentPreference' }
      ]
    });

    // Write a sample row with example values
    await csvWriter.writeRecords([{
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      counselor_email: 'counselor@school.edu',
      phone: '123-456-7890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      ssn: '123-45-6789',
      dateOfBirth: '2000-01-01',
      program: 'Program Name',
      site: 'Site Name',
      lcgmsCode: '123456',
      geographicDistrict: 'District 1',
      bronx: 'true',
      brooklyn: 'false',
      queens: 'true',
      statenIsland: 'false',
      manhattan: 'true',
      morning: 'true',
      afternoon: 'false',
      evening: 'true',
      weekend: 'false',
      fingerprintQuestionnaire: 'true',
      documentsVerified: 'true',
      attendanceVerified: 'true',
      fingerprintPaymentPreference: 'yes'
    }]);

    // Read the file content
    const fileContent = readFileSync(tempFilePath, 'utf-8');

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="template.csv"'
      }
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
} 