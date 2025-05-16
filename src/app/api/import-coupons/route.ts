import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'app', 'data', 'coupons.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('coupons');

    // Clear existing coupons
    await collection.deleteMany({});

    // Insert new coupons
    const coupons = data.map((row: any) => ({
      coupon_id: row.coupon_id,
      coupon_code: row.coupon_code,
      assigned_to: null, // Will store student ID when assigned
      assigned_at: null,
      status: 'available' // available, assigned, used
    }));

    const result = await collection.insertMany(coupons);

    return NextResponse.json({ 
      success: true, 
      message: `Imported ${result.insertedCount} coupons` 
    });
  } catch (error) {
    console.error('Error importing coupons:', error);
    return NextResponse.json(
      { error: 'Failed to import coupons' },
      { status: 500 }
    );
  }
} 