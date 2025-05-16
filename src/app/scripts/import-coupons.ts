const fs = require('fs').promises;
const path = require('path');
const Papa = require('papaparse');
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function importCoupons() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'app', 'data', 'coupons.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    // Use the same connection string as your main application
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('coupons');

    // Clear existing coupons
    await collection.deleteMany({});

    // Insert new coupons
    const coupons = data.map((row: any) => ({
      coupon_id: row.coupon_id,
      coupon_code: row.coupon_code,
      assigned_to: null,
      assigned_at: null,
      status: 'available'
    }));

    const result = await collection.insertMany(coupons);
    console.log(`Successfully imported ${result.insertedCount} coupons`);
  } catch (error) {
    console.error('Error importing coupons:', error);
  } finally {
    process.exit();
  }
}

importCoupons(); 