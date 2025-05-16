import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please add your MongoDB database name to .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log('Creating new MongoDB client in development mode');
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  console.log('Creating new MongoDB client in production mode');
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Test the connection
clientPromise.then(async (client) => {
  try {
    const db = client.db('district79');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    const applications = db.collection('applications');
    const count = await applications.countDocuments();
    console.log('Number of applications in database:', count);
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
  }
}).catch(error => {
  console.error('Error connecting to MongoDB:', error);
});

export default clientPromise;
export const getDb = async () => {
  const client = await clientPromise;
  return client.db(dbName);
}; 